/**
 * 插件加载器
 * 负责从本地目录扫描、验证和加载插件
 */

import { invoke } from "@tauri-apps/api/core";
import { parseManifest, checkVersionCompatibility, type PluginManifest } from "./PluginManifest";

/** 已加载的插件数据 */
export interface LoadedPlugin {
  /** 插件 ID */
  id: string;
  /** 插件 manifest */
  manifest: PluginManifest;
  /** 插件入口 JS 源码 */
  entryCode: string;
  /** 插件所在目录路径 */
  directory: string;
}

/** 应用版本号（从 package.json 同步） */
const APP_VERSION = "0.1.0";

/**
 * 获取插件目录路径
 */
export async function getPluginsDirectory(): Promise<string> {
  return invoke<string>("get_plugins_dir");
}

/**
 * 扫描插件目录，返回所有发现的插件目录名
 */
export async function scanPluginDirectories(): Promise<string[]> {
  try {
    return invoke<string[]>("list_plugin_dirs");
  } catch (err) {
    console.warn("扫描插件目录失败:", err);
    return [];
  }
}

/**
 * 读取插件目录中的文件内容
 */
async function readPluginFile(pluginDir: string, fileName: string): Promise<string> {
  return invoke<string>("read_plugin_file", { pluginDir, fileName });
}

/**
 * 加载单个插件
 * 读取 manifest.json 并验证，然后加载入口 JS 文件
 *
 * @param pluginDir 插件目录名（相对于插件根目录）
 * @returns 加载成功返回 LoadedPlugin，失败返回错误信息
 */
export async function loadPlugin(pluginDir: string): Promise<{
  plugin?: LoadedPlugin;
  error?: string;
}> {
  try {
    // 1. 读取 manifest.json
    let manifestJson: string;
    try {
      manifestJson = await readPluginFile(pluginDir, "manifest.json");
    } catch {
      return { error: `插件 "${pluginDir}" 缺少 manifest.json` };
    }

    // 2. 解析和验证 manifest
    const result = parseManifest(manifestJson);
    if (!result.valid || !result.manifest) {
      return {
        error: `插件 "${pluginDir}" manifest 验证失败:\n${result.errors.join("\n")}`,
      };
    }

    const manifest = result.manifest;

    // 3. 检查版本兼容性
    const compat = checkVersionCompatibility(manifest.minAppVersion, APP_VERSION);
    if (!compat.compatible) {
      return {
        error: `插件 "${manifest.id}" 版本不兼容: ${compat.reason}`,
      };
    }

    // 4. 读取入口 JS 文件
    let entryCode: string;
    try {
      entryCode = await readPluginFile(pluginDir, manifest.entry);
    } catch {
      return {
        error: `插件 "${manifest.id}" 入口文件 "${manifest.entry}" 读取失败`,
      };
    }

    return {
      plugin: {
        id: manifest.id,
        manifest,
        entryCode,
        directory: pluginDir,
      },
    };
  } catch (err) {
    return {
      error: `加载插件 "${pluginDir}" 时发生异常: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 批量加载所有插件
 * 扫描插件目录，逐个加载并返回结果
 */
export async function loadAllPlugins(): Promise<{
  plugins: LoadedPlugin[];
  errors: string[];
}> {
  const plugins: LoadedPlugin[] = [];
  const errors: string[] = [];

  const dirs = await scanPluginDirectories();

  for (const dir of dirs) {
    const result = await loadPlugin(dir);
    if (result.plugin) {
      plugins.push(result.plugin);
    }
    if (result.error) {
      errors.push(result.error);
    }
  }

  return { plugins, errors };
}
