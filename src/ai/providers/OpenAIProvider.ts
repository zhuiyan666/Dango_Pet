/**
 * OpenAI 模型适配器
 * 兼容 OpenAI API 格式（GPT-4o, GPT-4o-mini 等）
 * 同时兼容 Ollama 的 OpenAI 格式接口
 */

import type {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
} from "../LLMProvider";

interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "OpenAI";
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: OpenAIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );
    this.model = config.model ?? "gpt-4o-mini";
  }

  /**
   * 将通用消息格式转换为 OpenAI 格式
   * OpenAI 格式本身就是标准格式，直接透传
   */
  private formatMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages;
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.formatMessages(messages),
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        stop: options?.stop,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "未知错误");
      throw new Error(
        `OpenAI API 请求失败 (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage
        ? {
            prompt: data.usage.prompt_tokens ?? 0,
            completion: data.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.formatMessages(messages),
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        stop: options?.stop,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "未知错误");
      throw new Error(
        `OpenAI API 流式请求失败 (${response.status}): ${errorText}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法获取响应流");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") {
            yield { content: "", done: true };
            return;
          }

          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content ?? "";
            const finished = data.choices?.[0]?.finish_reason != null;
            if (content || finished) {
              yield { content, done: finished };
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // 确保最终标记完成
    yield { content: "", done: true };
  }
}
