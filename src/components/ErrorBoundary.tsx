/**
 * 错误边界组件
 * 捕获子组件的渲染错误，显示友好的错误提示
 */

import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义降级 UI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] 捕获到错误:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            zIndex: 30000,
          }}
        >
          <div
            style={{
              padding: "24px 32px",
              background: "rgba(245, 245, 250, 0.98)",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              maxWidth: 300,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {"(×_×)"}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#333",
                marginBottom: 8,
              }}
            >
              团子遇到了一点问题
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#999",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.message ?? "未知错误"}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
