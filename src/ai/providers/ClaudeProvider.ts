/**
 * Claude 模型适配器
 * 使用 Anthropic Messages API 格式
 */

import type {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
} from "../LLMProvider";

interface ClaudeProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class ClaudeProvider implements LLMProvider {
  readonly name = "Claude";
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: ClaudeProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (
      config.baseUrl ?? "https://api.anthropic.com"
    ).replace(/\/$/, "");
    this.model = config.model ?? "claude-3-5-sonnet-20241022";
  }

  /**
   * 将通用消息格式转换为 Anthropic 格式
   * - system 消息需要提取出来作为顶层参数
   * - 其余消息作为 messages 数组
   */
  private formatMessages(messages: ChatMessage[]): {
    system?: string;
    messages: { role: "user" | "assistant"; content: string }[];
  } {
    let system: string | undefined;
    const formatted: { role: "user" | "assistant"; content: string }[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        // 多个 system 消息合并
        system = system ? `${system}\n\n${msg.content}` : msg.content;
      } else {
        formatted.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return { system, messages: formatted };
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const { system, messages: formattedMessages } =
      this.formatMessages(messages);

    const body: Record<string, unknown> = {
      model: this.model,
      messages: formattedMessages,
      max_tokens: options?.maxTokens ?? 1024,
    };
    if (system) body.system = system;
    if (options?.temperature != null) body.temperature = options.temperature;
    if (options?.stop) body.stop_sequences = options.stop;

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "未知错误");
      throw new Error(
        `Claude API 请求失败 (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    const content =
      data.content?.[0]?.type === "text" ? data.content[0].text : "";

    return {
      content,
      usage: data.usage
        ? {
            prompt: data.usage.input_tokens ?? 0,
            completion: data.usage.output_tokens ?? 0,
          }
        : undefined,
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk> {
    const { system, messages: formattedMessages } =
      this.formatMessages(messages);

    const body: Record<string, unknown> = {
      model: this.model,
      messages: formattedMessages,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    };
    if (system) body.system = system;
    if (options?.temperature != null) body.temperature = options.temperature;
    if (options?.stop) body.stop_sequences = options.stop;

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "未知错误");
      throw new Error(
        `Claude API 流式请求失败 (${response.status}): ${errorText}`,
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
          try {
            const data = JSON.parse(dataStr);

            if (data.type === "content_block_delta") {
              const content = data.delta?.text ?? "";
              yield { content, done: false };
            } else if (data.type === "message_stop") {
              yield { content: "", done: true };
              return;
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { content: "", done: true };
  }
}
