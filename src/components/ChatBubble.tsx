/**
 * 对话气泡组件
 * 双击宠物弹出，支持对话历史、流式输出、拖拽移动
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { ChatManager } from "@/ai/ChatManager";
import type { ChatRecord } from "@/ai/ChatManager";

interface ChatBubbleProps {
  /** 是否显示 */
  visible: boolean;
  /** 对话管理器实例 */
  chatManager: ChatManager;
  /** 初始位置 X */
  x: number;
  /** 初始位置 Y */
  y: number;
  /** 关闭回调 */
  onClose: () => void;
}

/** 消息气泡组件 */
function MessageBubble({ record }: { record: ChatRecord }) {
  const isUser = record.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "8px 12px",
          borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          background: isUser
            ? "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
            : "rgba(255, 255, 255, 0.95)",
          color: isUser ? "#fff" : "#333",
          fontSize: 13,
          lineHeight: 1.5,
          wordBreak: "break-word",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        {record.content}
      </div>
    </div>
  );
}

/** 流式输出中消息 */
function StreamingMessage({ content }: { content: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "8px 12px",
          borderRadius: "12px 12px 12px 4px",
          background: "rgba(255, 255, 255, 0.95)",
          color: "#333",
          fontSize: 13,
          lineHeight: 1.5,
          wordBreak: "break-word",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        {content}
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 14,
            background: "#ff9a9e",
            marginLeft: 2,
            verticalAlign: "middle",
            animation: "blink 1s step-end infinite",
          }}
        />
      </div>
    </div>
  );
}

/** 离线降级提示 */
function OfflineHint() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "16px 12px",
        color: "#999",
        fontSize: 13,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>
        {"(\\u25D5\\u203F\\u25D5)"}
      </div>
      <div>我还没学会说话呢~</div>
      <div style={{ marginTop: 4, fontSize: 12 }}>
        去设置里配置一下 API Key 吧！
      </div>
    </div>
  );
}

export function ChatBubble({
  visible,
  chatManager,
  x,
  y,
  onClose,
}: ChatBubbleProps) {
  const [messages, setMessages] = useState<ChatRecord[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x, y });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAvailable = chatManager.isAvailable();

  // 同步初始位置
  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  // 加载当前会话消息
  useEffect(() => {
    if (!visible) return;

    // 确保有活跃会话
    let session = chatManager.getActiveSession();
    if (!session) {
      session = chatManager.createSession();
    }
    setMessages([...session.messages]);
  }, [visible, chatManager]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // 自动聚焦输入框
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  // ESC 关闭
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  /** 拖拽处理 */
  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming || !isAvailable) return;

    setInputText("");

    // 立即显示用户消息
    const userRecord: ChatRecord = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userRecord]);

    setIsStreaming(true);
    setStreamingContent("");

    try {
      for await (const chunk of chatManager.streamMessage(text)) {
        setStreamingContent(chunk.fullContent);
      }

      // 流式完成后更新消息列表
      setMessages((prev) => {
        // 移除临时用户消息，添加正式的用户消息和助手回复
        const session = chatManager.getActiveSession();
        return session ? [...session.messages] : prev;
      });
      setStreamingContent("");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "发送消息失败";
      setStreamingContent(`出错了: ${errorMsg}`);
    } finally {
      setIsStreaming(false);
    }
  }, [inputText, isStreaming, isAvailable, chatManager]);

  /** 按 Enter 发送 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (!visible) return null;

  return (
    <>
      {/* 光标闪烁动画样式 */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          width: 360,
          maxHeight: 500,
          display: "flex",
          flexDirection: "column",
          background: "rgba(245, 245, 250, 0.98)",
          borderRadius: 16,
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          zIndex: 10000,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          animation: "contextMenuFadeIn 0.15s ease-out",
        }}
      >
        {/* 标题栏（可拖拽） */}
        <div
          onMouseDown={handleHeaderMouseDown}
          style={{
            padding: "10px 14px",
            background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>
              {"(\\u25D5\\u203F\\u25D5)"}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>和团子聊天</span>
            {isAvailable && (
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                  background: "rgba(255,255,255,0.2)",
                  padding: "1px 6px",
                  borderRadius: 8,
                }}
              >
                {chatManager.getActiveModelName()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* 消息区域 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 12,
            minHeight: 200,
            maxHeight: 320,
          }}
        >
          {!isAvailable ? (
            <OfflineHint />
          ) : messages.length === 0 && !streamingContent ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 12px",
                color: "#aaa",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>
                {"(\\u25D5\\u203F\\u25D5)"}
              </div>
              <div>你好呀！和我聊聊天吧~</div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} record={msg} />
              ))}
              {streamingContent && (
                <StreamingMessage content={streamingContent} />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div
          style={{
            padding: "8px 12px 12px",
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAvailable ? "和团子说点什么..." : "请先配置 API Key"}
            disabled={!isAvailable || isStreaming}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 20,
              border: "1px solid rgba(0, 0, 0, 0.1)",
              outline: "none",
              fontSize: 13,
              background: "#fff",
              color: "#333",
              opacity: isAvailable ? 1 : 0.6,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!isAvailable || isStreaming || !inputText.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "none",
              background:
                !isAvailable || isStreaming || !inputText.trim()
                  ? "#ccc"
                  : "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor:
                !isAvailable || isStreaming || !inputText.trim()
                  ? "default"
                  : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {isStreaming ? "..." : "发送"}
          </button>
        </div>
      </div>
    </>
  );
}
