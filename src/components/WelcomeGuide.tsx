/**
 * 首次启动引导组件
 * 简短的欢迎提示，介绍基本操作
 */

import { useState, useCallback } from "react";

interface WelcomeGuideProps {
  /** 完成引导回调 */
  onComplete: () => void;
}

/** 引导步骤内容 */
const STEPS = [
  {
    icon: "(◕‿◕)",
    title: "你好！我是团子 Dango",
    description: "你的桌面宠物伙伴~ 让我来介绍一下怎么和我互动吧！",
  },
  {
    icon: "\u{1F4A5}",
    title: "点击和拖拽",
    description: "单击我会有反应，拖拽可以移动我的位置哦~",
  },
  {
    icon: "\u{1F4AC}",
    title: "双击聊天",
    description: "双击我可以打开对话气泡，配置 API Key 后就能和我聊天啦！",
  },
  {
    icon: "\u{1F50D}",
    title: "右键菜单",
    description: "右键点击可以打开菜单，里面有设置、外观和插件管理。",
  },
];

export function WelcomeGuide({ onComplete }: WelcomeGuideProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const current = STEPS[step]!;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: 340,
          background: "rgba(245, 245, 250, 0.98)",
          borderRadius: 20,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "contextMenuFadeIn 0.2s ease-out",
        }}
      >
        {/* 顶部渐变区域 */}
        <div
          style={{
            padding: "32px 24px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>{current.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {current.title}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6 }}>
            {current.description}
          </div>
        </div>

        {/* 步骤指示器 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            padding: "16px 0 8px",
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === step
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "rgba(0, 0, 0, 0.12)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* 按钮区域 */}
        <div
          style={{
            padding: "8px 24px 24px",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "1px solid rgba(0, 0, 0, 0.1)",
              background: "#fff",
              fontSize: 13,
              cursor: "pointer",
              color: "#999",
            }}
          >
            跳过
          </button>
          <button
            onClick={handleNext}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLast ? "开始使用" : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}
