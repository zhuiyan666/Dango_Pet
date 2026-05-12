/**
 * 插件系统 Hook
 * 提供对插件系统上下文的访问
 */

import { useContext, createContext } from "react";
import type { PluginManager, PluginStatus, PluginManifest } from "./index";

/** 插件面板实例 */
export interface PluginPanel {
  id: string;
  pluginId: string;
  html: string;
  width: number;
  height: number;
}

/** 插件菜单项 */
export interface PluginMenuItem {
  id: string;
  pluginId: string;
  label: string;
  callback: () => void;
}

/** 插件系统上下文值 */
export interface PluginSystemContextValue {
  /** 插件管理器实例 */
  manager: PluginManager | null;
  /** 是否已初始化 */
  initialized: boolean;
  /** 所有插件状态 */
  plugins: Array<{ id: string; status: PluginStatus; manifest: PluginManifest }>;
  /** 插件面板列表 */
  panels: PluginPanel[];
  /** 关闭面板 */
  closePanel: (id: string) => void;
  /** 插件菜单项 */
  menuItems: PluginMenuItem[];
  /** 插件气泡 */
  bubble: { visible: boolean; content: string; x: number; y: number };
  /** 激活插件 */
  activatePlugin: (id: string) => Promise<void>;
  /** 停用插件 */
  deactivatePlugin: (id: string) => Promise<void>;
}

/** 插件系统上下文 */
export const PluginSystemContext = createContext<PluginSystemContextValue>({
  manager: null,
  initialized: false,
  plugins: [],
  panels: [],
  closePanel: () => {},
  menuItems: [],
  bubble: { visible: false, content: "", x: 0, y: 0 },
  activatePlugin: async () => {},
  deactivatePlugin: async () => {},
});

/**
 * 使用插件系统上下文
 */
export function usePluginSystem(): PluginSystemContextValue {
  return useContext(PluginSystemContext);
}
