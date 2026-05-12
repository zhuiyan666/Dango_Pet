/**
 * AI 对话模块
 * 统一导出所有 AI 相关类型和功能
 */

export type {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  MessageRole,
} from "./LLMProvider";

export type {
  ModelConfig,
  ModelProviderType,
} from "./ModelConfig";

export { ModelConfigManager } from "./ModelConfig";

export type {
  ChatRecord,
  ChatSession,
} from "./ChatManager";

export { ChatManager } from "./ChatManager";

export { OpenAIProvider } from "./providers/OpenAIProvider";
export { ClaudeProvider } from "./providers/ClaudeProvider";
export { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider";

export { DEFAULT_SYSTEM_PROMPT } from "./prompts/default";
