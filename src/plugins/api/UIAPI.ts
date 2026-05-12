/**
 * UI 渲染 API (dango.ui)
 * 提供面板显示、气泡、菜单项注册等 UI 能力
 */

import type { PermissionChecker } from "../permissions";

/** 面板配置选项 */
export interface PanelOptions {
  html: string;
  width?: number;
  height?: number;
}

/** UI 渲染 API 接口 */
export interface UIAPI {
  showPanel(options: PanelOptions): string;
  closePanel(id: string): void;
  showBubble(content: string, duration?: number): void;
  registerMenuItem(label: string, callback: () => void): string;
  removeMenuItem(id: string): void;
}

/** UI 宿主接口 — 由 React 组件提供实际实现 */
export interface UIHost {
  showPanel(pluginId: string, options: PanelOptions): string;
  closePanel(id: string): void;
  showBubble(content: string, duration?: number): void;
  registerMenuItem(pluginId: string, label: string, callback: () => void): string;
  removeMenuItem(id: string): void;
}

/**
 * 创建 UI 渲染 API 实例
 */
export function createUIAPI(
  pluginId: string,
  permissions: PermissionChecker,
  host: UIHost,
): UIAPI {
  return {
    showPanel(options: PanelOptions): string {
      permissions.assertApiAccess("ui");
      return host.showPanel(pluginId, options);
    },

    closePanel(id: string): void {
      permissions.assertApiAccess("ui");
      host.closePanel(id);
    },

    showBubble(content: string, duration?: number): void {
      permissions.assertApiAccess("ui");
      host.showBubble(content, duration);
    },

    registerMenuItem(label: string, callback: () => void): string {
      permissions.assertApiAccess("ui");
      return host.registerMenuItem(pluginId, label, callback);
    },

    removeMenuItem(id: string): void {
      permissions.assertApiAccess("ui");
      host.removeMenuItem(id);
    },
  };
}
