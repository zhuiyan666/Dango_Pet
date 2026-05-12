/**
 * 点击穿透 Hook
 * 实现非宠物区域的鼠标事件穿透到下层窗口
 * 利用 Tauri 的 setIgnoreCursorEvents API
 */

import { useCallback, useEffect, useRef } from "react";

export function useClickThrough() {
  const canvasRef = useRef<HTMLDivElement>(null);

  /**
   * 鼠标进入宠物区域时取消穿透
   * 鼠标离开宠物区域时启用穿透
   */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    let isSetup = false;

    const setupClickThrough = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();

        // 鼠标进入宠物区域 → 接收鼠标事件
        el.addEventListener("mouseenter", () => {
          appWindow.setIgnoreCursorEvents(false);
        });

        // 鼠标离开宠物区域 → 穿透鼠标事件
        el.addEventListener("mouseleave", () => {
          appWindow.setIgnoreCursorEvents(true);
        });

        // 初始状态启用穿透
        await appWindow.setIgnoreCursorEvents(true);
        isSetup = true;
      } catch {
        // 非 Tauri 环境静默忽略
      }
    };

    setupClickThrough();

    return () => {
      // 清理时重置穿透状态
      if (isSetup) {
        import("@tauri-apps/api/window")
          .then(({ getCurrentWindow }) => getCurrentWindow().setIgnoreCursorEvents(false))
          .catch(() => {});
      }
    };
  }, []);

  /**
   * 点击宠物时的交互处理
   * 后续扩展为摸头反应、弹出菜单等
   */
  const handleClickThrough = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Phase 2 实现具体交互逻辑
    console.log("宠物被点击了！", e.clientX, e.clientY);
  }, []);

  return { canvasRef, handleClickThrough };
}
