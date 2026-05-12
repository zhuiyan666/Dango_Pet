/**
 * 鼠标位置追踪 Hook
 * 持续获取鼠标全局坐标，通过 Tauri 后端命令获取
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { MousePosition } from "@/types";

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 50;

export function useMousePosition() {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  /**
   * 从 Tauri 后端获取鼠标位置
   */
  const fetchMousePosition = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const pos = await invoke<MousePosition>("get_mouse_position");
      setMousePos(pos);
    } catch {
      // 非 Tauri 环境使用浏览器 API
      // 浏览器中无法获取全局鼠标位置，只能在事件中获取
    }
  }, []);

  /**
   * 启动轮询
   */
  const startPolling = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    intervalRef.current = setInterval(fetchMousePosition, POLL_INTERVAL);
  }, [fetchMousePosition]);

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    isRunningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return { mousePos, startPolling, stopPolling };
}
