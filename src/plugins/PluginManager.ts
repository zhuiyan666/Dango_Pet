/**
 * 插件生命周期管理器
 * 管理插件的加载、激活、停用、卸载和重载
 */

import { PermissionChecker } from "./permissions";
import { executeInSandbox, type PluginExports } from "./PluginSandbox";
import { createDangoAPI, type DangoAPI, type APIHosts } from "./api";
import { loadAllPlugins, type LoadedPlugin } from "./PluginLoader";

/** 插件状态 */
export type PluginStatus =
  | "loaded"       // 已加载（manifest 已解析，代码已读取）
  | "activated"    // 已激活（activate 已调用）
  | "deactivated"  // 已停用（deactivate 已调用）
  | "unloaded"     // 已卸载（资源已释放）
  | "error";       // 出错

/** 运行中的插件实例信息 */
export interface PluginInstance {
  /** 插件 ID */
  id: string;
  /** 当前状态 */
  status: PluginStatus;
  /** 插件 manifest */
  manifest: LoadedPlugin["manifest"];
  /** 插件导出 */
  exports: PluginExports;
  /** 权限检查器 */
  permissions: PermissionChecker;
  /** dango API 实例 */
  dango: DangoAPI;
  /** 定时器 ID 集合（用于清理） */
  timers: Set<ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>>;
  /** 事件监听器映射（用于清理） */
  eventListeners: Map<string, Set<(...args: unknown[]) => void>>;
}

/** 插件管理器配置 */
export interface PluginManagerConfig {
  /** API 宿主实现 */
  hosts: APIHosts;
}

/**
 * 插件管理器 — 插件系统的核心调度器
 */
export class PluginManager {
  /** 已加载的插件实例映射 */
  private plugins: Map<string, PluginInstance> = new Map();
  /** API 宿主实现 */
  private hosts: APIHosts;
  /** 事件分发器（用于 events API） */
  private eventBus: Map<string, Map<string, Set<(...args: unknown[]) => void>>> = new Map();

  constructor(config: PluginManagerConfig) {
    this.hosts = config.hosts;
  }

  /**
   * 初始化：扫描并加载所有插件
   */
  async initialize(): Promise<{ loaded: number; errors: string[] }> {
    const { plugins, errors } = await loadAllPlugins();
    let loaded = 0;

    for (const plugin of plugins) {
      const result = this.load(plugin);
      if (result.success) {
        loaded++;
      } else {
        errors.push(result.error ?? `加载插件 "${plugin.id}" 失败`);
      }
    }

    return { loaded, errors };
  }

  /**
   * 加载单个插件
   * 解析 manifest、创建沙箱、注入 API
   */
  load(plugin: LoadedPlugin): { success: boolean; error?: string } {
    // 检查是否已加载
    if (this.plugins.has(plugin.id)) {
      return { success: false, error: `插件 "${plugin.id}" 已加载` };
    }

    // 创建权限检查器
    const permissions = new PermissionChecker(plugin.manifest.permissions);

    // 创建 dango API（使用自定义的 events host 来桥接事件总线）
    const dango = createDangoAPI(plugin.id, permissions, {
      pet: this.hosts.pet,
      ui: this.hosts.ui,
      events: this.createEventsHost(plugin.id),
      ai: this.hosts.ai,
    });

    // 在沙箱中执行插件代码
    let exports: PluginExports;
    try {
      exports = executeInSandbox(plugin.entryCode, dango);
    } catch (err) {
      return {
        success: false,
        error: `插件 "${plugin.id}" 沙箱执行失败: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    // 创建插件实例
    const instance: PluginInstance = {
      id: plugin.id,
      status: "loaded",
      manifest: plugin.manifest,
      exports,
      permissions,
      dango,
      timers: new Set(),
      eventListeners: new Map(),
    };

    this.plugins.set(plugin.id, instance);
    console.log(`插件已加载: ${plugin.id} (v${plugin.manifest.version})`);
    return { success: true };
  }

  /**
   * 激活插件
   * 调用插件导出的 activate() 函数
   */
  async activate(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return { success: false, error: `插件 "${pluginId}" 未加载` };
    }

    if (instance.status === "activated") {
      return { success: true }; // 已激活，幂等
    }

    if (!instance.exports.activate) {
      return { success: false, error: `插件 "${pluginId}" 没有导出 activate 函数` };
    }

    try {
      await instance.exports.activate(instance.dango);
      instance.status = "activated";
      console.log(`插件已激活: ${pluginId}`);
      return { success: true };
    } catch (err) {
      instance.status = "error";
      return {
        success: false,
        error: `插件 "${pluginId}" 激活失败: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * 停用插件
   * 调用插件导出的 deactivate() 函数并清理资源
   */
  async deactivate(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return { success: false, error: `插件 "${pluginId}" 未加载` };
    }

    if (instance.status === "deactivated" || instance.status === "loaded") {
      return { success: true }; // 已停用或未激活
    }

    try {
      if (instance.exports.deactivate) {
        await instance.exports.deactivate();
      }
    } catch (err) {
      console.warn(`插件 "${pluginId}" deactivate 执行出错:`, err);
    }

    // 清理插件创建的定时器
    for (const timer of instance.timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    instance.timers.clear();

    // 清理插件注册的事件监听器
    this.cleanupPluginEvents(pluginId);
    instance.eventListeners.clear();

    instance.status = "deactivated";
    console.log(`插件已停用: ${pluginId}`);
    return { success: true };
  }

  /**
   * 卸载插件
   * 先停用，再完全移除
   */
  async unload(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return { success: false, error: `插件 "${pluginId}" 未加载` };
    }

    // 先停用
    if (instance.status === "activated") {
      const deactivateResult = await this.deactivate(pluginId);
      if (!deactivateResult.success) {
        return deactivateResult;
      }
    }

    instance.status = "unloaded";
    this.plugins.delete(pluginId);
    console.log(`插件已卸载: ${pluginId}`);
    return { success: true };
  }

  /**
   * 重新加载插件
   * 先卸载，再重新加载和激活
   */
  async reload(plugin: LoadedPlugin): Promise<{ success: boolean; error?: string }> {
    const wasActivated = this.plugins.get(plugin.id)?.status === "activated";

    // 卸载旧实例
    if (this.plugins.has(plugin.id)) {
      const unloadResult = await this.unload(plugin.id);
      if (!unloadResult.success) {
        return unloadResult;
      }
    }

    // 重新加载
    const loadResult = this.load(plugin);
    if (!loadResult.success) {
      return loadResult;
    }

    // 如果之前是激活状态，自动重新激活
    if (wasActivated) {
      return this.activate(plugin.id);
    }

    return { success: true };
  }

  /**
   * 获取插件实例
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件状态
   */
  getAllPlugins(): Array<{ id: string; status: PluginStatus; manifest: LoadedPlugin["manifest"] }> {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      status: p.status,
      manifest: p.manifest,
    }));
  }

  /**
   * 为插件创建事件宿主实现
   * 桥接到内部事件总线
   */
  private createEventsHost(pluginId: string): APIHosts["events"] {
    return {
      on: (_pid: string, event: string, callback: (...args: unknown[]) => void) => {
        if (!this.eventBus.has(event)) {
          this.eventBus.set(event, new Map());
        }
        const eventListeners = this.eventBus.get(event)!;
        if (!eventListeners.has(pluginId)) {
          eventListeners.set(pluginId, new Set());
        }
        eventListeners.get(pluginId)!.add(callback);

        // 记录到插件实例中以便清理
        const instance = this.plugins.get(pluginId);
        if (instance) {
          if (!instance.eventListeners.has(event)) {
            instance.eventListeners.set(event, new Set());
          }
          instance.eventListeners.get(event)!.add(callback);
        }
      },

      off: (_pid: string, event: string, callback: (...args: unknown[]) => void) => {
        this.eventBus.get(event)?.get(pluginId)?.delete(callback);
        const instance = this.plugins.get(pluginId);
        instance?.eventListeners.get(event)?.delete(callback);
      },
    };
  }

  /**
   * 清理插件注册的所有事件监听器
   */
  private cleanupPluginEvents(pluginId: string): void {
    for (const listeners of this.eventBus.values()) {
      listeners.delete(pluginId);
    }
  }

  /**
   * 向所有已激活的插件广播事件
   * 供应用层调用，分发系统事件
   */
  emitEvent(event: string, ...args: unknown[]): void {
    const listeners = this.eventBus.get(event);
    if (!listeners) return;

    for (const callbacks of listeners.values()) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (err) {
          console.warn(`插件事件处理出错 (${event}):`, err);
        }
      }
    }
  }

  /**
   * 销毁管理器，停用并卸载所有插件
   */
  async destroy(): Promise<void> {
    const ids = Array.from(this.plugins.keys());
    for (const id of ids) {
      await this.unload(id);
    }
    this.eventBus.clear();
  }
}
