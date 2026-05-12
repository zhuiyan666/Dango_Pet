/**
 * 右键菜单配置
 */

import type { ContextMenuItem } from "@/types";

/** 默认菜单项 */
export const DEFAULT_MENU_ITEMS: ContextMenuItem[] = [
  { id: "settings", label: "设置", icon: "settings" },
  { id: "appearance", label: "外观", icon: "appearance" },
  { id: "separator1", label: "", separator: true },
  { id: "plugins", label: "插件管理", icon: "plugins" },
  { id: "separator2", label: "", separator: true },
  { id: "about", label: "关于团子", icon: "about" },
  { id: "quit", label: "退出", icon: "quit" },
];

/** 菜单图标映射 */
export const MENU_ICONS: Record<string, string> = {
  settings: "⚙",
  appearance: "\u{1F3A8}",
  plugins: "\u{1F9E9}",
  about: "ℹ",
  quit: "❌",
};
