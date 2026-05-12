/**
 * LLM 统一接口层
 * 屏蔽不同模型 API 的差异，提供统一的对话和流式输出能力
 */

/** 对话消息角色 */
export type MessageRole = "system" | "user" | "assistant";

/** 对话消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** 对话请求选项 */
export interface ChatOptions {
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 停止序列 */
  stop?: string[];
}

/** 对话响应 */
export interface ChatResponse {
  /** 生成的文本内容 */
  content: string;
  /** token 使用量 */
  usage?: {
    prompt: number;
    completion: number;
  };
}

/** 流式输出片段 */
export interface ChatChunk {
  /** 本片段的文本内容 */
  content: string;
  /** 是否已完成 */
  done: boolean;
}

/**
 * LLM 提供者接口
 * 所有模型适配器都需要实现此接口
 */
export interface LLMProvider {
  /** 提供者名称 */
  readonly name: string;

  /**
   * 完整对话（非流式）
   * @param messages 对话历史
   * @param options 选项
   * @returns 完整的对话响应
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * 流式对话
   * @param messages 对话历史
   * @param options 选项
   * @returns 异步迭代器，逐块返回文本
   */
  streamChat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk>;
}
