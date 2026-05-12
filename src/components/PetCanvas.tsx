/**
 * 宠物 Canvas 组件
 * 管理 Canvas 元素、渲染循环、动画状态和行为系统
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { SpriteRenderer, AnimationManager } from "@/core";
import {
  createIdlePlaceholder,
  createWalkPlaceholder,
  createSleepPlaceholder,
  createInteractPlaceholder,
  createDraggedPlaceholder,
} from "@/utils/placeholderSprite";
import { usePetBehavior } from "@/hooks/usePetBehavior";
import { EmotionBubble } from "./EmotionBubble";
import { randomEmotion } from "./emotionPresets";
import { updatePetState } from "@/plugins/petStateStore";
import type { AnimationClip, PetState, BehaviorType, BehaviorEvent } from "@/types";

/** 动画片段配置 */
const IDLE_CLIP: AnimationClip = {
  name: "idle",
  spriteSrc: "/sprites/dango-idle.png",
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 4,
  fps: 4,
  loop: true,
};

const WALK_CLIP: AnimationClip = {
  name: "walk",
  spriteSrc: "/sprites/dango-walk.png",
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 6,
  fps: 8,
  loop: true,
};

const SLEEP_CLIP: AnimationClip = {
  name: "sleep",
  spriteSrc: "/sprites/dango-sleep.png",
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 4,
  fps: 2,
  loop: true,
};

const INTERACT_CLIP: AnimationClip = {
  name: "interact",
  spriteSrc: "/sprites/dango-interact.png",
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 4,
  fps: 6,
  loop: true,
};

const DRAGGED_CLIP: AnimationClip = {
  name: "dragged",
  spriteSrc: "/sprites/dango-dragged.png",
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 4,
  fps: 10,
  loop: true,
};

/** 行为到动画状态的映射 */
function behaviorToAnimState(behavior: BehaviorType): PetState {
  switch (behavior) {
    case "idle":
    case "stretch":
    case "yawn":
      return "idle";
    case "walk":
    case "chase_mouse":
    case "wall_climb":
      return "walk";
    case "sleep":
      return "sleep";
    case "interact":
      return "interact";
    case "dragged":
      return "interact"; // 使用 interact 作为拖拽的占位动画
    case "fall":
      return "idle";
    default:
      return "idle";
  }
}

interface PetCanvasProps {
  /** 画布宽度 */
  width?: number;
  /** 画布高度 */
  height?: number;
  /** 精灵图缩放比例 */
  scale?: number;
  /** 额外的动画片段 */
  extraClips?: AnimationClip[];
}

export function PetCanvas({
  width = 300,
  height = 300,
  scale = 2,
  extraClips = [],
}: PetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animManagerRef = useRef<AnimationManager | null>(null);
  const rafIdRef = useRef<number>(0);
  const [, setCurrentState] = useState<PetState>("idle");

  // 表情气泡状态
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleEmotion, setBubbleEmotion] = useState("");
  const [bubbleX, setBubbleX] = useState(0);
  const [bubbleY, setBubbleY] = useState(0);

  // 行为系统
  const {
    behavior,
    position,
    facing,
    handleClick,
    handleDoubleClick,
    handleDragStart,
    handleDragEnd,
    onBehaviorEvent,
  } = usePetBehavior({
    windowWidth: width,
    windowHeight: height,
    petWidth: 128 * scale / 2,
    petHeight: 128 * scale / 2,
  });

  // 当前渲染器位置
  const rendererPosRef = useRef({ x: 0, y: 0 });

  /**
   * 动画循环 — 由 requestAnimationFrame 驱动
   */
  const animationLoop = useCallback((timestamp: number) => {
    animManagerRef.current?.update(timestamp);
    rafIdRef.current = requestAnimationFrame(animationLoop);
  }, []);

  /**
   * 显示表情气泡
   */
  const showEmotionBubble = useCallback((category: Parameters<typeof randomEmotion>[0]) => {
    const emotion = randomEmotion(category);
    setBubbleEmotion(emotion);
    setBubbleX(rendererPosRef.current.x + 64);
    setBubbleY(rendererPosRef.current.y);
    setBubbleVisible(true);
  }, []);

  // 初始化渲染器和动画管理器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 创建渲染器
    const renderer = new SpriteRenderer({
      canvas,
      x: position.x,
      y: position.y,
      scale,
    });

    // 创建动画管理器
    const manager = new AnimationManager(renderer);

    // 注册所有动画片段
    manager.registerClip(IDLE_CLIP);
    manager.registerClip(WALK_CLIP);
    manager.registerClip(SLEEP_CLIP);
    manager.registerClip(INTERACT_CLIP);
    manager.registerClip(DRAGGED_CLIP);

    // 注册额外的动画片段
    for (const clip of extraClips) {
      manager.registerClip(clip);
    }

    // 生成占位精灵图
    const idleSource = createIdlePlaceholder(IDLE_CLIP.frameCount, IDLE_CLIP.frameWidth);
    const walkSource = createWalkPlaceholder(WALK_CLIP.frameCount, WALK_CLIP.frameWidth);
    const sleepSource = createSleepPlaceholder(SLEEP_CLIP.frameCount, SLEEP_CLIP.frameWidth);
    const interactSource = createInteractPlaceholder(INTERACT_CLIP.frameCount, INTERACT_CLIP.frameWidth);
    const draggedSource = createDraggedPlaceholder(DRAGGED_CLIP.frameCount, DRAGGED_CLIP.frameWidth);

    manager.registerSource("idle", idleSource);
    manager.registerSource("walk", walkSource);
    manager.registerSource("sleep", sleepSource);
    manager.registerSource("interact", interactSource);
    manager.registerSource("dragged", draggedSource);

    animManagerRef.current = manager;

    // 启动 idle 动画
    manager.transitionTo("idle").catch(console.error);

    // 启动动画循环
    rafIdRef.current = requestAnimationFrame(animationLoop);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      manager.destroy();
      animManagerRef.current = null;
    };
  }, [width, height, scale, extraClips, animationLoop, position.x, position.y]);

  // 监听行为事件，更新动画状态和显示气泡
  useEffect(() => {
    // 交互事件 — 显示表情气泡
    const handleInteractEvent = (event: BehaviorEvent) => {
      if (event.data && (event.data as { type?: string }).type === "pet") {
        showEmotionBubble("pet");
      }
      if (event.data && (event.data as { type?: string }).type === "dialog") {
        showEmotionBubble("happy");
      }
    };

    // 拖拽事件
    const handleDraggedEvent = () => {
      showEmotionBubble("surprised");
    };

    // 掉落事件
    const handleFallEvent = () => {
      showEmotionBubble("pet");
    };

    // 伸懒腰
    const handleStretchEvent = () => {
      showEmotionBubble("stretch");
    };

    // 打哈欠
    const handleYawnEvent = () => {
      showEmotionBubble("yawn");
    };

    // 睡觉
    const handleSleepEvent = () => {
      showEmotionBubble("sleepy");
    };

    onBehaviorEvent("interact", handleInteractEvent);
    onBehaviorEvent("dragged", handleDraggedEvent);
    onBehaviorEvent("fall", handleFallEvent);
    onBehaviorEvent("stretch", handleStretchEvent);
    onBehaviorEvent("yawn", handleYawnEvent);
    onBehaviorEvent("sleep", handleSleepEvent);

    return () => {
      // 清理由 BehaviorController 自动处理
    };
  }, [onBehaviorEvent, showEmotionBubble]);

  // 当行为改变时切换动画
  useEffect(() => {
    const animState = behaviorToAnimState(behavior);
    const manager = animManagerRef.current;
    if (manager && manager.getState() !== animState) {
      manager.transitionTo(animState).catch(console.error);
      setCurrentState(animState);
    }
  }, [behavior]);

  // 同步宠物状态到全局存储（供插件系统读取）
  useEffect(() => {
    updatePetState({
      state: behaviorToAnimState(behavior),
      position: { x: position.x, y: position.y },
      facing: facing > 0 ? "right" : "left",
    });
  }, [behavior, position, facing]);

  // 更新渲染器位置（跟随行为系统计算的位置）
  useEffect(() => {
    const manager = animManagerRef.current;
    if (manager) {
      // AnimationManager 通过 renderer 间接更新位置
      rendererPosRef.current = { x: position.x, y: position.y };
      // 使用 renderer.setPosition
      (manager as unknown as { renderer: { setPosition: (x: number, y: number) => void } }).renderer.setPosition(position.x, position.y);
    }
  }, [position]);

  // 处理拖拽（Tauri 窗口拖拽与行为系统联动）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        handleDragStart();
        // Tauri 窗口拖拽由上层 useWindowDrag 处理
      }
    },
    [handleDragStart],
  );

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  return (
    <div
      style={{ position: "relative", width, height }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          background: "transparent",
          cursor: "pointer",
          display: "block",
        }}
      />

      {/* 表情气泡 */}
      <EmotionBubble
        visible={bubbleVisible}
        emotion={bubbleEmotion}
        x={bubbleX}
        y={bubbleY}
        onClose={() => setBubbleVisible(false)}
      />

      {/* 开发用状态显示 — 生产环境可移除 */}
      <div
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 10,
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        {behavior} | {facing > 0 ? "R" : "L"}
      </div>
    </div>
  );
}
