/**
 * 对话管理器
 * 管理对话历史、系统提示词、上下文窗口和持久化
 */

import type {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatChunk,
} from "./LLMProvider";
import type { ModelConfig } from "./ModelConfig";
import { ModelConfigManager } from "./ModelConfig";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { ClaudeProvider } from "./providers/ClaudeProvider";
import { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider";
import { DEFAULT_SYSTEM_PROMPT } from "./prompts/default";

/** 单条对话记录 */
export interface ChatRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/** 对话会话 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatRecord[];
  createdAt: number;
  updatedAt: number;
}

const CHAT_STORAGE_KEY = "dango_chat_sessions";
const MAX_CONTEXT_MESSAGES = 20;
const MAX_CONTEXT_TOKENS_ESTIMATE = 4000;

/**
 * 根据配置创建对应的 LLM 提供者实例
 */
function createProvider(config: ModelConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      });
    case "claude":
      return new ClaudeProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      });
    case "openai-compatible":
      return new OpenAICompatibleProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl!,
        model: config.model,
      });
    default:
      throw new Error(`不支持的提供者类型: ${config.provider as string}`);
  }
}

/**
 * 生成唯一 ID
 */
function genId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 对话管理器
 * 负责对话的创建、消息管理、AI 调用和持久化
 */
export class ChatManager {
  private configManager: ModelConfigManager;
  private sessions: ChatSession[] = [];
  private activeSessionId: string | null = null;
  private systemPrompt: string = DEFAULT_SYSTEM_PROMPT;

  constructor(configManager: ModelConfigManager) {
    this.configManager = configManager;
    this.loadSessions();
  }

  /** 从本地存储加载对话历史 */
  private loadSessions(): void {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        this.sessions = JSON.parse(raw);
        const first = this.sessions[0];
        if (first) {
          this.activeSessionId = first.id;
        }
      }
    } catch {
      this.sessions = [];
    }
  }

  /** 保存对话历史到本地存储 */
  private saveSessions(): void {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.sessions));
  }

  /** 获取所有会话 */
  getSessions(): ChatSession[] {
    return [...this.sessions];
  }

  /** 获取当前活跃会话 */
  getActiveSession(): ChatSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.find((s) => s.id === this.activeSessionId) ?? null;
  }

  /** 创建新会话 */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: genId(),
      title: `对话 ${this.sessions.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.unshift(session);
    this.activeSessionId = session.id;
    this.saveSessions();
    return session;
  }

  /** 切换活跃会话 */
  setActiveSession(sessionId: string): boolean {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return false;
    this.activeSessionId = sessionId;
    return true;
  }

  /** 删除会话 */
  deleteSession(sessionId: string): boolean {
    const index = this.sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) return false;

    this.sessions.splice(index, 1);

    if (this.activeSessionId === sessionId) {
      const first = this.sessions[0];
      this.activeSessionId = first ? first.id : null;
    }

    this.saveSessions();
    return true;
  }

  /** 添加用户消息 */
  addUserMessage(content: string): ChatRecord | null {
    const session = this.getActiveSession();
    if (!session) return null;

    const record: ChatRecord = {
      id: genId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    session.messages.push(record);
    session.updatedAt = Date.now();
    this.saveSessions();
    return record;
  }

  /** 添加助手消息 */
  addAssistantMessage(content: string): ChatRecord | null {
    const session = this.getActiveSession();
    if (!session) return null;

    const record: ChatRecord = {
      id: genId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
    session.messages.push(record);
    session.updatedAt = Date.now();
    this.saveSessions();
    return record;
  }

  /**
   * 构建发送给 LLM 的消息列表
   * 包含系统提示词和截断后的对话历史
   */
  private buildMessages(): ChatMessage[] {
    const session = this.getActiveSession();
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
    ];

    if (session) {
      // 取最近的消息，控制上下文窗口大小
      const recentMessages = session.messages.slice(-MAX_CONTEXT_MESSAGES);

      // 简单的 token 估算：1 个中文字符约 2 token，1 个英文单词约 1 token
      let estimatedTokens = 0;
      const selectedMessages: ChatMessage[] = [];

      for (let i = recentMessages.length - 1; i >= 0; i--) {
        const msg = recentMessages[i];
        if (!msg) continue;
        const tokens = Math.ceil(msg.content.length * 1.5);
        if (estimatedTokens + tokens > MAX_CONTEXT_TOKENS_ESTIMATE) break;
        estimatedTokens += tokens;
        selectedMessages.unshift({
          role: msg.role,
          content: msg.content,
        });
      }

      messages.push(...selectedMessages);
    }

    return messages;
  }

  /**
   * 检查是否有可用的 AI 配置
   */
  isAvailable(): boolean {
    return this.configManager.hasActiveConfig();
  }

  /**
   * 获取当前活跃配置的模型名称
   */
  getActiveModelName(): string | null {
    const config = this.configManager.getActive();
    if (!config) return null;
    return config.model;
  }

  /**
   * 发送消息并获取完整回复（非流式）
   */
  async sendMessage(
    content: string,
    options?: ChatOptions,
  ): Promise<string> {
    const config = this.configManager.getActive();
    if (!config) {
      throw new Error("未配置 AI 模型，请在设置中配置 API Key");
    }

    // 添加用户消息
    this.addUserMessage(content);

    // 构建消息列表
    const messages = this.buildMessages();

    // 创建提供者并调用
    const provider = createProvider(config);
    const chatOptions: ChatOptions = {
      maxTokens: config.maxTokens ?? options?.maxTokens,
      temperature: config.temperature ?? options?.temperature,
      ...options,
    };

    const response = await provider.chat(messages, chatOptions);

    // 添加助手回复
    this.addAssistantMessage(response.content);

    return response.content;
  }

  /**
   * 发送消息并获取流式回复
   * 返回 AsyncIterable，每个 chunk 包含部分文本
   */
  async *streamMessage(
    content: string,
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk & { fullContent: string }> {
    const config = this.configManager.getActive();
    if (!config) {
      throw new Error("未配置 AI 模型，请在设置中配置 API Key");
    }

    // 添加用户消息
    this.addUserMessage(content);

    // 构建消息列表
    const messages = this.buildMessages();

    // 创建提供者并调用
    const provider = createProvider(config);
    const chatOptions: ChatOptions = {
      maxTokens: config.maxTokens ?? options?.maxTokens,
      temperature: config.temperature ?? options?.temperature,
      ...options,
    };

    let fullContent = "";

    for await (const chunk of provider.streamChat(messages, chatOptions)) {
      fullContent += chunk.content;
      yield { ...chunk, fullContent };
    }

    // 流式完成后，保存完整回复
    this.addAssistantMessage(fullContent);
  }

  /** 更新系统提示词 */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /** 获取当前系统提示词 */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }
}
