/**
 * 点击穿透 Hook
 * 实现非宠物区域的鼠标事件穿透到下层窗口
 * 利用 Tauri 的 setIgnoreCursorEvents API
 */

import { useCallback, useEffect, useRef } from "react";

export function useClickThrough() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isClickThroughRef = useRef(false);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    let cleanup: (() => void) | null = null;

    const setupClickThrough = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();

        // 鼠标进入宠物区域 → 接收鼠标事件
        const onEnter = () => {
          if (isClickThroughRef.current) {
            appWindow.setIgnoreCursorEvents(false);
            isClickThroughRef.current = false;
          }
        };

        // 鼠标离开宠物区域 → 穿透鼠标事件
        const onLeave = () => {
          if (!isClickThroughRef.current) {
            appWindow.setIgnoreCursorEvents(true);
            isClickThroughRef.current = true;
          }
        };

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);

        // 初始状态：不穿透（让用户能与宠物交互）
        // 延迟启用穿透，等首次鼠标离开宠物区域后再启用
        await appWindow.setIgnoreCursorEvents(false);

        cleanup = () => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
          appWindow.setIgnoreCursorEvents(false).catch(() => {});
        };
      } catch {
        // 非 Tauri 环境静默忽略
      }
    };

    setupClickThrough();

    return () => {
      cleanup?.();
    };
  }, []);

  /**
   * 点击宠物时的交互处理
   */
  const handleClickThrough = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("宠物被点击了！", e.clientX, e.clientY);
  }, []);

  return { canvasRef, handleClickThrough };
}
