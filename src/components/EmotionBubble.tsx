/**
 * 表情气泡组件
 * 宠物交互时弹出的表情/文字气泡
 */

import { useEffect, useState } from "react";

interface EmotionBubbleProps {
  /** 是否显示 */
  visible: boolean;
  /** 表情文本 */
  emotion: string;
  /** 气泡位置（相对于画布） */
  x: number;
  y: number;
  /** 自动关闭时间（毫秒） */
  duration?: number;
  /** 关闭回调 */
  onClose: () => void;
}

export function EmotionBubble({
  visible,
  emotion,
  x,
  y,
  duration = 2000,
  onClose,
}: EmotionBubbleProps) {
  const [opacity, setOpacity] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (!visible) return;

    // 淡入
    setOpacity(1);
    setOffsetY(0);

    // 上浮动画
    const floatTimer = setTimeout(() => {
      setOffsetY(-20);
    }, 50);

    // 自动关闭
    const closeTimer = setTimeout(() => {
      setOpacity(0);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(floatTimer);
      clearTimeout(closeTimer);
    };
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + offsetY,
        transform: "translate(-50%, -100%)",
        opacity,
        transition: "opacity 0.3s ease-out, top 0.5s ease-out",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* 气泡主体 */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: 12,
          padding: "6px 12px",
          fontSize: 14,
          fontFamily: "'Segoe UI Emoji', 'Apple Color Emoji', sans-serif",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          position: "relative",
          color: "#333",
        }}
      >
        {emotion}

        {/* 气泡尾巴 */}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid rgba(255, 255, 255, 0.95)",
          }}
        />
      </div>
    </div>
  );
}

