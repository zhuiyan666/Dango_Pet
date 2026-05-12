/**
 * 团子 Dango 桌面宠物 — 主应用组件
 * 负责透明窗口交互、点击穿透、右键菜单和宠物画布渲染
 * 集成插件系统、AI 对话和设置面板
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { PetCanvas } from "@/components/PetCanvas";
import { ContextMenu } from "@/components/ContextMenu";
import { DEFAULT_MENU_ITEMS } from "@/components/contextMenuItems";
import { ChatBubble } from "@/components/ChatBubble";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { useClickThrough } from "@/hooks/useClickThrough";
import { PluginSystemProvider, usePluginSystem } from "@/plugins";
import { getPetState } from "@/plugins/petStateStore";
import { ModelConfigManager, ChatManager } from "@/ai";

/** 宠物画布尺寸 */
const CANVAS_SIZE = 300;

/** 全局单例：配置管理器和对话管理器 */
const configManager = new ModelConfigManager();
const chatManager = new ChatManager(configManager);

/**
 * 应用内部组件（在 PluginSystemProvider 内部使用 usePluginSystem）
 */
function AppContent() {
  const { handleMouseDown } = useWindowDrag();
  const { canvasRef, handleClickThrough } = useClickThrough();
  const { menuItems: pluginMenuItems } = usePluginSystem();

  // 右键菜单状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);

  // AI 对话状态
  const [chatVisible, setChatVisible] = useState(false);
  const [chatX, setChatX] = useState(100);
  const [chatY, setChatY] = useState(100);

  // 设置面板状态
  const [settingsVisible, setSettingsVisible] = useState(false);

  // 记录双击位置（用于气泡定位）
  const lastDoubleClickRef = useRef({ x: 100, y: 100 });

  // 合并默认菜单项和插件菜单项
  const allMenuItems = useMemo(() => {
    const items = [...DEFAULT_MENU_ITEMS];
    if (pluginMenuItems.length > 0) {
      // 在"插件管理"之后插入插件注册的菜单项
      const pluginIndex = items.findIndex((item) => item.id === "plugins");
      const pluginItems = pluginMenuItems.map((pm) => ({
        id: pm.id,
        label: pm.label,
        icon: "plugins" as const,
      }));
      if (pluginIndex >= 0) {
        items.splice(pluginIndex + 1, 0, ...pluginItems);
      } else {
        items.push(
          { id: "separator-plugin", label: "", separator: true },
          ...pluginItems,
        );
      }
    }
    return items;
  }, [pluginMenuItems]);

  /**
   * 右键菜单处理
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuX(e.clientX);
    setMenuY(e.clientY);
    setMenuVisible(true);
  }, []);

  /**
   * 关闭右键菜单
   */
  const handleMenuClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  /**
   * 菜单项选择处理
   */
  const handleMenuSelect = useCallback(
    (id: string) => {
      // 先检查是否是插件菜单项
      const pluginItem = pluginMenuItems.find((pm) => pm.id === id);
      if (pluginItem) {
        pluginItem.callback();
        return;
      }

      // 默认菜单项处理
      switch (id) {
        case "settings":
          setSettingsVisible(true);
          break;
        case "appearance":
          // TODO: 打开外观选择
          break;
        case "plugins":
          // TODO: 打开插件管理
          break;
        case "about":
          // TODO: 显示关于信息
          break;
        case "quit":
          import("@tauri-apps/api/core")
            .then(({ invoke }) => invoke("quit_app"))
            .catch(() => {});
          break;
      }
    },
    [pluginMenuItems],
  );

  /**
   * 双击宠物打开对话气泡
   */
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    // 定位对话气泡到双击位置附近
    const bubbleX = Math.min(e.clientX, window.innerWidth - 380);
    const bubbleY = Math.max(e.clientY - 300, 10);
    lastDoubleClickRef.current = { x: bubbleX, y: bubbleY };
    setChatX(bubbleX);
    setChatY(bubbleY);
    setChatVisible(true);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleCanvasDoubleClick}
    >
      <div
        ref={canvasRef as React.RefObject<HTMLDivElement>}
        onClick={handleClickThrough}
      >
        <PetCanvas
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          scale={2}
        />
      </div>

      {/* 自定义右键菜单 */}
      <ContextMenu
        visible={menuVisible}
        x={menuX}
        y={menuY}
        items={allMenuItems}
        onClose={handleMenuClose}
        onSelect={handleMenuSelect}
      />

      {/* AI 对话气泡 */}
      <ChatBubble
        visible={chatVisible}
        chatManager={chatManager}
        x={chatX}
        y={chatY}
        onClose={() => setChatVisible(false)}
      />

      {/* 设置面板 */}
      <SettingsPanel
        visible={settingsVisible}
        configManager={configManager}
        onClose={() => setSettingsVisible(false)}
        onConfigChange={() => {
          // 配置变更后不需要特殊处理，ChatManager 会读取最新配置
        }}
      />
    </div>
  );
}

/**
 * 主应用组件 — 包裹 PluginSystemProvider
 */
export default function App() {
  return (
    <PluginSystemProvider getPetState={getPetState}>
      <AppContent />
    </PluginSystemProvider>
  );
}
