/**
 * 插件系统 React Provider
 * 初始化插件管理器，提供 API 宿主实现，管理插件 UI 元素
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PluginManager,
  type APIHosts,
  type PanelOptions,
} from "./index";
import {
  PluginSystemContext,
  type PluginSystemContextValue,
  type PluginPanel,
  type PluginMenuItem,
} from "./usePluginSystem";
import type { PetState } from "@/types";

/** Provider Props */
interface PluginSystemProviderProps {
  children: ReactNode;
  /** 宠物状态提供器 */
  getPetState: () => { state: PetState; position: { x: number; y: number }; facing: "left" | "right" };
}

export function PluginSystemProvider({
  children,
  getPetState,
}: PluginSystemProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [plugins, setPlugins] = useState<PluginSystemContextValue["plugins"]>([]);
  const [panels, setPanels] = useState<PluginPanel[]>([]);
  const [menuItems, setMenuItems] = useState<PluginMenuItem[]>([]);
  const [bubble, setBubble] = useState({ visible: false, content: "", x: 0, y: 0 });

  const managerRef = useRef<PluginManager | null>(null);
  const panelIdRef = useRef(0);
  const menuItemIdRef = useRef(0);

  // 刷新插件列表
  const refreshPlugins = useCallback(() => {
    const mgr = managerRef.current;
    if (mgr) {
      setPlugins(mgr.getAllPlugins());
    }
  }, []);

  // 构建 API 宿主实现
  const hosts: APIHosts = useMemo(
    () => ({
      pet: {
        async playAnimation(name: string) {
          // 动画播放由应用层的 PetCanvas 处理
          console.log("[PetAPI] playAnimation:", name);
        },
        async moveTo(x: number, y: number) {
          console.log("[PetAPI] moveTo:", x, y);
        },
        say(text: string, duration = 3000) {
          const petState = getPetState();
          setBubble({
            visible: true,
            content: text,
            x: petState.position.x + 64,
            y: petState.position.y,
          });
          setTimeout(() => {
            setBubble((prev) => ({ ...prev, visible: false }));
          }, duration);
        },
        emote(type: string) {
          const petState = getPetState();
          setBubble({
            visible: true,
            content: type,
            x: petState.position.x + 64,
            y: petState.position.y,
          });
          setTimeout(() => {
            setBubble((prev) => ({ ...prev, visible: false }));
          }, 2000);
        },
        getState() {
          const petState = getPetState();
          return {
            state: petState.state,
            position: petState.position,
            facing: petState.facing,
          };
        },
        getPosition() {
          return getPetState().position;
        },
      },

      ui: {
        showPanel(pluginId: string, options: PanelOptions) {
          const id = `panel-${++panelIdRef.current}`;
          setPanels((prev) => [
            ...prev,
            {
              id,
              pluginId,
              html: options.html,
              width: options.width ?? 300,
              height: options.height ?? 200,
            },
          ]);
          return id;
        },
        closePanel(id: string) {
          setPanels((prev) => prev.filter((p) => p.id !== id));
        },
        showBubble(content: string, duration = 3000) {
          const petState = getPetState();
          setBubble({
            visible: true,
            content,
            x: petState.position.x + 64,
            y: petState.position.y,
          });
          setTimeout(() => {
            setBubble((prev) => ({ ...prev, visible: false }));
          }, duration);
        },
        registerMenuItem(pluginId: string, label: string, callback: () => void) {
          const id = `menu-${++menuItemIdRef.current}`;
          setMenuItems((prev) => [...prev, { id, pluginId, label, callback }]);
          return id;
        },
        removeMenuItem(id: string) {
          setMenuItems((prev) => prev.filter((item) => item.id !== id));
        },
      },

      events: {
        on: () => {},
        off: () => {},
      },

      ai: {
        async chat() {
          return "AI 对话功能尚未连接（需要配置 LLM API Key）";
        },
        onMessage: () => {},
      },
    }),
    [getPetState],
  );

  // 初始化插件管理器
  useEffect(() => {
    const initPluginSystem = async () => {
      try {
        const manager = new PluginManager({ hosts });
        managerRef.current = manager;

        const result = await manager.initialize();
        if (result.errors.length > 0) {
          console.warn("插件加载警告:", result.errors);
        }
        console.log(`插件系统初始化完成，已加载 ${result.loaded} 个插件`);

        refreshPlugins();
        setInitialized(true);
      } catch (err) {
        console.error("插件系统初始化失败:", err);
        setInitialized(true); // 即使失败也标记为已初始化
      }
    };

    initPluginSystem();

    return () => {
      const mgr = managerRef.current;
      if (mgr) {
        mgr.destroy();
        managerRef.current = null;
      }
    };
  }, [hosts, refreshPlugins]);

  // 关闭面板
  const closePanel = useCallback((id: string) => {
    setPanels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // 激活插件
  const activatePlugin = useCallback(
    async (id: string) => {
      const mgr = managerRef.current;
      if (mgr) {
        await mgr.activate(id);
        refreshPlugins();
      }
    },
    [refreshPlugins],
  );

  // 停用插件
  const deactivatePlugin = useCallback(
    async (id: string) => {
      const mgr = managerRef.current;
      if (mgr) {
        await mgr.deactivate(id);
        refreshPlugins();
      }
    },
    [refreshPlugins],
  );

  const contextValue: PluginSystemContextValue = {
    manager: managerRef.current,
    initialized,
    plugins,
    panels,
    closePanel,
    menuItems,
    bubble,
    activatePlugin,
    deactivatePlugin,
  };

  return (
    <PluginSystemContext.Provider value={contextValue}>
      {children}
      {/* 插件面板渲染 */}
      {panels.map((panel) => (
        <div
          key={panel.id}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: panel.width,
            height: panel.height,
            background: "rgba(30, 30, 30, 0.95)",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => closePanel(panel.id)}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: 12,
              zIndex: 1001,
            }}
          >
            x
          </button>
          {/* 插件 HTML 内容 */}
          <div
            style={{ width: "100%", height: "100%", color: "#fff", padding: 8 }}
            dangerouslySetInnerHTML={{ __html: panel.html }}
          />
        </div>
      ))}
      {/* 插件气泡渲染 */}
      {bubble.visible && (
        <div
          style={{
            position: "fixed",
            left: bubble.x,
            top: bubble.y,
            transform: "translate(-50%, -100%)",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: 12,
              padding: "6px 12px",
              fontSize: 14,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              color: "#333",
            }}
          >
            {bubble.content}
          </div>
        </div>
      )}
    </PluginSystemContext.Provider>
  );
}
