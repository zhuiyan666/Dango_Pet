/**
 * 设置面板组件
 * 包含模型选择、API Key 配置、模型参数调整
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { ModelConfigManager } from "@/ai/ModelConfig";
import type { ModelConfig, ModelProviderType } from "@/ai/ModelConfig";

interface SettingsPanelProps {
  /** 是否显示 */
  visible: boolean;
  /** 配置管理器实例 */
  configManager: ModelConfigManager;
  /** 关闭回调 */
  onClose: () => void;
  /** 配置变更回调 */
  onConfigChange?: () => void;
}

/** 提供者类型选项 */
const PROVIDER_OPTIONS: {
  value: ModelProviderType;
  label: string;
  defaultModel: string;
  defaultBaseUrl?: string;
}[] = [
  {
    value: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
  },
  {
    value: "claude",
    label: "Claude (Anthropic)",
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  {
    value: "openai-compatible",
    label: "OpenAI 兼容 (国产模型/Ollama)",
    defaultModel: "qwen-turbo",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
];

export function SettingsPanel({
  visible,
  configManager,
  onClose,
  onConfigChange,
}: SettingsPanelProps) {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 编辑状态
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editProvider, setEditProvider] = useState<ModelProviderType>("openai");
  const [editApiKey, setEditApiKey] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editMaxTokens, setEditMaxTokens] = useState("1024");
  const [editTemperature, setEditTemperature] = useState("0.7");
  const [showApiKey, setShowApiKey] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  /** 刷新配置列表 */
  const refreshConfigs = useCallback(() => {
    setConfigs(configManager.getAll());
    const active = configManager.getActive();
    setActiveId(active?.id ?? null);
  }, [configManager]);

  useEffect(() => {
    if (visible) {
      refreshConfigs();
      resetForm();
    }
  }, [visible, refreshConfigs]);

  /** 重置表单 */
  const resetForm = () => {
    setEditId(null);
    setEditName("");
    setEditProvider("openai");
    setEditApiKey("");
    setEditBaseUrl("");
    setEditModel("gpt-4o-mini");
    setEditMaxTokens("1024");
    setEditTemperature("0.7");
    setShowApiKey(false);
  };

  /** 编辑已有配置 */
  const startEdit = (config: ModelConfig) => {
    setEditId(config.id);
    setEditName(config.name);
    setEditProvider(config.provider);
    setEditApiKey(config.apiKey);
    setEditBaseUrl(config.baseUrl ?? "");
    setEditModel(config.model);
    setEditMaxTokens(String(config.maxTokens ?? 1024));
    setEditTemperature(String(config.temperature ?? 0.7));
    setShowApiKey(false);
  };

  /** 新建配置 */
  const startNew = () => {
    resetForm();
    setEditId("new");
    setEditName(`配置 ${configs.length + 1}`);
  };

  /** 提供者类型变更时更新默认值 */
  const handleProviderChange = (provider: ModelProviderType) => {
    setEditProvider(provider);
    const option = PROVIDER_OPTIONS.find((o) => o.value === provider);
    if (option) {
      setEditModel(option.defaultModel);
      setEditBaseUrl(option.defaultBaseUrl ?? "");
    }
  };

  /** 保存配置 */
  const handleSave = () => {
    if (!editApiKey.trim()) {
      alert("请输入 API Key");
      return;
    }

    const defaultModel = PROVIDER_OPTIONS.find(
      (o) => o.value === editProvider,
    )?.defaultModel ?? "gpt-4o-mini";

    const configData = {
      name: editName || `${editProvider} 配置`,
      provider: editProvider,
      apiKey: editApiKey.trim(),
      baseUrl: editBaseUrl.trim() || undefined,
      model: editModel || defaultModel,
      maxTokens: parseInt(editMaxTokens) || 1024,
      temperature: parseFloat(editTemperature) || 0.7,
    };

    if (editId === "new") {
      configManager.add(configData);
    } else if (editId) {
      configManager.update(editId, configData);
    }

    refreshConfigs();
    resetForm();
    onConfigChange?.();
  };

  /** 删除配置 */
  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个配置吗？")) {
      configManager.remove(id);
      refreshConfigs();
      onConfigChange?.();
    }
  };

  /** 激活配置 */
  const handleSetActive = (id: string) => {
    configManager.setActive(id);
    refreshConfigs();
    onConfigChange?.();
  };

  /** 点击外部关闭 */
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
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

  /** ESC 关闭 */
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  /** 输入框通用样式 */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    outline: "none",
    fontSize: 13,
    background: "#fff",
    color: "#333",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: 420,
        maxHeight: "80vh",
        background: "rgba(245, 245, 250, 0.98)",
        borderRadius: 16,
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
        zIndex: 10001,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: "12px 16px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>AI 设置</span>
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
          }}
        >
          x
        </button>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
        }}
      >
        {/* 已有配置列表 */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#444",
              marginBottom: 8,
            }}
          >
            模型配置
          </div>

          {configs.length === 0 ? (
            <div
              style={{
                padding: "12px",
                background: "rgba(0,0,0,0.03)",
                borderRadius: 8,
                color: "#999",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              暂无配置，请添加一个
            </div>
          ) : (
            configs.map((config) => (
              <div
                key={config.id}
                style={{
                  padding: "10px 12px",
                  marginBottom: 6,
                  background:
                    config.id === activeId
                      ? "rgba(102, 126, 234, 0.08)"
                      : "rgba(0,0,0,0.02)",
                  borderRadius: 8,
                  border:
                    config.id === activeId
                      ? "1px solid rgba(102, 126, 234, 0.3)"
                      : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#333",
                    }}
                  >
                    {config.name}
                    {config.id === activeId && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "#667eea",
                          background: "rgba(102, 126, 234, 0.1)",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        当前
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {config.provider} / {config.model}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {config.id !== activeId && (
                    <button
                      onClick={() => handleSetActive(config.id)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "1px solid rgba(0,0,0,0.1)",
                        background: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#667eea",
                      }}
                    >
                      使用
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(config)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "1px solid rgba(0,0,0,0.1)",
                      background: "#fff",
                      fontSize: 11,
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "1px solid rgba(0,0,0,0.1)",
                      background: "#fff",
                      fontSize: 11,
                      cursor: "pointer",
                      color: "#e74c3c",
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={startNew}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: 8,
              borderRadius: 8,
              border: "1px dashed rgba(0,0,0,0.15)",
              background: "transparent",
              fontSize: 13,
              cursor: "pointer",
              color: "#667eea",
            }}
          >
            + 添加新配置
          </button>
        </div>

        {/* 编辑表单 */}
        {editId && (
          <div
            style={{
              padding: 14,
              background: "rgba(0,0,0,0.02)",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#444",
                marginBottom: 12,
              }}
            >
              {editId === "new" ? "新建配置" : "编辑配置"}
            </div>

            {/* 配置名称 */}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>配置名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="给配置起个名字"
                style={inputStyle}
              />
            </div>

            {/* 提供者类型 */}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>模型提供者</label>
              <select
                value={editProvider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as ModelProviderType)
                }
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                }}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>API Key</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    color: "#999",
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  {showApiKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>

            {/* Base URL（OpenAI 兼容模式必填） */}
            {editProvider === "openai-compatible" ? (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>API 地址 (必填)</label>
                <input
                  type="text"
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  style={inputStyle}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>API 地址 (可选)</label>
                <input
                  type="text"
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  placeholder="留空使用默认地址"
                  style={inputStyle}
                />
              </div>
            )}

            {/* 模型名称 */}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>模型名称</label>
              <input
                type="text"
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                placeholder="gpt-4o-mini"
                style={inputStyle}
              />
            </div>

            {/* 参数行 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>最大 Token</label>
                <input
                  type="number"
                  value={editMaxTokens}
                  onChange={(e) => setEditMaxTokens(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>温度 (0-2)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={editTemperature}
                  onChange={(e) => setEditTemperature(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "8px",
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
                保存
              </button>
              <button
                onClick={resetForm}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
