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
      return "interact";
    case "fall":
      return "idle";
    default:
      return "idle";
  }
}

interface PetCanvasProps {
  width?: number;
  height?: number;
  scale?: number;
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
  const rendererRef = useRef<SpriteRenderer | null>(null);
  const rafIdRef = useRef<number>(0);

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
    petWidth: 64,
    petHeight: 64,
  });

  // 是否正在拖拽（区分拖拽和点击）
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  /**
   * 动画循环
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
    setBubbleX(position.x + 64);
    setBubbleY(position.y);
    setBubbleVisible(true);
  }, [position.x, position.y]);

  // 初始化渲染器（只创建一次）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new SpriteRenderer({
      canvas,
      x: width / 2 - 32,
      y: height / 2 - 32,
      scale,
    });
    rendererRef.current = renderer;

    const manager = new AnimationManager(renderer);
    animManagerRef.current = manager;

    // 注册动画片段
    manager.registerClip(IDLE_CLIP);
    manager.registerClip(WALK_CLIP);
    manager.registerClip(SLEEP_CLIP);
    manager.registerClip(INTERACT_CLIP);
    manager.registerClip(DRAGGED_CLIP);
    for (const clip of extraClips) {
      manager.registerClip(clip);
    }

    // 注册占位精灵图
    manager.registerSource("idle", createIdlePlaceholder(IDLE_CLIP.frameCount, IDLE_CLIP.frameWidth));
    manager.registerSource("walk", createWalkPlaceholder(WALK_CLIP.frameCount, WALK_CLIP.frameWidth));
    manager.registerSource("sleep", createSleepPlaceholder(SLEEP_CLIP.frameCount, SLEEP_CLIP.frameWidth));
    manager.registerSource("interact", createInteractPlaceholder(INTERACT_CLIP.frameCount, INTERACT_CLIP.frameWidth));
    manager.registerSource("dragged", createDraggedPlaceholder(DRAGGED_CLIP.frameCount, DRAGGED_CLIP.frameWidth));

    // 启动 idle 动画
    manager.transitionTo("idle").catch(console.error);

    // 启动动画循环
    rafIdRef.current = requestAnimationFrame(animationLoop);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      manager.destroy();
      animManagerRef.current = null;
      rendererRef.current = null;
    };
  }, [width, height, scale, extraClips, animationLoop]);

  // 监听行为事件
  useEffect(() => {
    const handleInteractEvent = (event: BehaviorEvent) => {
      if (event.data && (event.data as { type?: string }).type === "pet") {
        showEmotionBubble("pet");
      }
      if (event.data && (event.data as { type?: string }).type === "dialog") {
        showEmotionBubble("happy");
      }
    };

    onBehaviorEvent("interact", handleInteractEvent);
    onBehaviorEvent("dragged", () => showEmotionBubble("surprised"));
    onBehaviorEvent("fall", () => showEmotionBubble("pet"));
    onBehaviorEvent("stretch", () => showEmotionBubble("stretch"));
    onBehaviorEvent("yawn", () => showEmotionBubble("yawn"));
    onBehaviorEvent("sleep", () => showEmotionBubble("sleepy"));
  }, [onBehaviorEvent, showEmotionBubble]);

  // 行为改变时切换动画
  useEffect(() => {
    const animState = behaviorToAnimState(behavior);
    const manager = animManagerRef.current;
    if (manager && manager.getState() !== animState) {
      manager.transitionTo(animState).catch(console.error);
    }
  }, [behavior]);

  // 更新渲染器位置（跟随行为系统）
  useEffect(() => {
    rendererRef.current?.setPosition(position.x, position.y);
  }, [position.x, position.y]);

  // 同步宠物状态到全局存储
  useEffect(() => {
    updatePetState({
      state: behaviorToAnimState(behavior),
      position: { x: position.x, y: position.y },
      facing: facing > 0 ? "right" : "left",
    });
  }, [behavior, position, facing]);

  // 鼠标按下 — 记录位置，判断是否拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = false;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (me: MouseEvent) => {
      const dx = me.clientX - mouseDownPosRef.current.x;
      const dy = me.clientY - mouseDownPosRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
        handleDragStart();
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (isDraggingRef.current) {
        handleDragEnd();
      }
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [handleDragStart, handleDragEnd]);

  return (
    <div
      style={{ position: "relative", width, height }}
      onMouseDown={handleMouseDown}
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

      <EmotionBubble
        visible={bubbleVisible}
        emotion={bubbleEmotion}
        x={bubbleX}
        y={bubbleY}
        onClose={() => setBubbleVisible(false)}
      />

      {/* 开发用状态显示 */}
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
