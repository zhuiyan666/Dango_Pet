/**
 * 窗口拖拽 Hook
 * 处理鼠标左键拖拽移动窗口位置
 * 利用 Tauri 的 window.startDragging() API
 */

import { useCallback } from "react";

export function useWindowDrag() {
  /**
   * 鼠标按下时开始窗口拖拽
   * 使用 Tauri v2 的 startDragging API
   */
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    // 仅左键触发拖拽
    if (e.button !== 0) return;

    try {
      // 动态导入避免在非 Tauri 环境报错
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {
      // 非 Tauri 环境（浏览器开发模式）静默忽略
    }
  }, []);

  return { handleMouseDown };
}
