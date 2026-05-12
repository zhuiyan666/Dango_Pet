/**
 * 宠物行为系统 Hook
 * 连接行为控制器和 React 组件，驱动宠物自主行为
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BehaviorController } from "@/core";
import { useMousePosition } from "./useMousePosition";
import type { BehaviorType, BehaviorEvent, Vec2, BehaviorConfig } from "@/types";

interface UsePetBehaviorOptions {
  /** 窗口宽度 */
  windowWidth?: number;
  /** 窗口高度 */
  windowHeight?: number;
  /** 宠物宽度 */
  petWidth?: number;
  /** 宠物高度 */
  petHeight?: number;
  /** 自定义行为配置 */
  config?: Partial<BehaviorConfig>;
}

interface UsePetBehaviorResult {
  /** 当前行为类型 */
  behavior: BehaviorType;
  /** 宠物在画布内的位置 */
  position: Vec2;
  /** 宠物朝向 */
  facing: 1 | -1;
  /** 点击处理 */
  handleClick: (e: React.MouseEvent) => void;
  /** 双击处理 */
  handleDoubleClick: (e: React.MouseEvent) => void;
  /** 拖拽开始 */
  handleDragStart: () => void;
  /** 拖拽结束 */
  handleDragEnd: () => void;
  /** 事件监听 */
  onBehaviorEvent: (event: string, handler: (event: BehaviorEvent) => void) => void;
  /** 取消事件监听 */
  offBehaviorEvent: (event: string, handler: (event: BehaviorEvent) => void) => void;
}

export function usePetBehavior(options: UsePetBehaviorOptions = {}): UsePetBehaviorResult {
  const {
    windowWidth = 300,
    windowHeight = 300,
    petWidth = 64,
    petHeight = 64,
    config = {},
  } = options;

  const [behavior, setBehavior] = useState<BehaviorType>("idle");
  const [position, setPosition] = useState<Vec2>({
    x: (windowWidth - petWidth) / 2,
    y: (windowHeight - petHeight) / 2,
  });
  const [facing, setFacing] = useState<1 | -1>(1);

  const controllerRef = useRef<BehaviorController | null>(null);
  const rafRef = useRef<number>(0);
  const { mousePos } = useMousePosition();
  const lastClickRef = useRef(0);

  // 初始化行为控制器
  useEffect(() => {
    const controller = new BehaviorController({
      windowWidth,
      windowHeight,
      petWidth,
      petHeight,
      ...config,
    });

    controllerRef.current = controller;

    // 注册所有行为事件的通用监听
    const allEvents = [
      "idle", "walk", "sleep", "interact", "chase_mouse",
      "stretch", "yawn", "dragged", "fall", "wall_climb",
    ];

    for (const eventName of allEvents) {
      controller.on(eventName, (event) => {
        setBehavior(event.type);
      });
    }

    controller.start();

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [windowWidth, windowHeight, petWidth, petHeight, config]);

  // 动画循环更新行为
  useEffect(() => {
    const loop = (timestamp: number) => {
      const controller = controllerRef.current;
      if (!controller) return;

      const result = controller.update(timestamp);
      setPosition(result.position);
      setFacing(result.facing);
      // behavior 状态由事件回调更新

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 同步鼠标位置到行为控制器
  useEffect(() => {
    controllerRef.current?.setMousePosition(mousePos);
  }, [mousePos]);

  // 点击处理（区分单击和双击）
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = performance.now();
    const timeSinceLastClick = now - lastClickRef.current;
    lastClickRef.current = now;

    // 300ms 内的连续点击视为双击
    if (timeSinceLastClick < 300) {
      controllerRef.current?.handleInteraction("double_click");
    } else {
      // 延迟单击处理，等待可能的双击
      setTimeout(() => {
        if (performance.now() - lastClickRef.current >= 280) {
          controllerRef.current?.handleInteraction("click");
        }
      }, 300);
    }
  }, []);

  // 双击处理
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    controllerRef.current?.handleInteraction("double_click");
  }, []);

  // 拖拽开始
  const handleDragStart = useCallback(() => {
    controllerRef.current?.handleInteraction("drag_start");
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    controllerRef.current?.handleInteraction("drag_end");
  }, []);

  // 事件监听
  const onBehaviorEvent = useCallback((event: string, handler: (event: BehaviorEvent) => void) => {
    controllerRef.current?.on(event, handler);
  }, []);

  const offBehaviorEvent = useCallback((event: string, handler: (event: BehaviorEvent) => void) => {
    controllerRef.current?.off(event, handler);
  }, []);

  return {
    behavior,
    position,
    facing,
    handleClick,
    handleDoubleClick,
    handleDragStart,
    handleDragEnd,
    onBehaviorEvent,
    offBehaviorEvent,
  };
}
