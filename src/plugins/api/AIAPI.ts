/**
 * AI 对话 API (dango.ai)
 * 提供 AI 对话能力，需要 ai:chat 权限
 */

import type { PermissionChecker } from "../permissions";

/** AI 对话回调函数类型 */
type MessageCallback = (message: string) => void;

/** AI 对话 API 接口 */
export interface AIAPI {
  chat(message: string): Promise<string>;
  onMessage(callback: MessageCallback): void;
}

/** AI 对话宿主接口 — 由应用层提供 AI 能力 */
export interface AIHost {
  chat(pluginId: string, message: string): Promise<string>;
  onMessage(pluginId: string, callback: MessageCallback): void;
}

/**
 * 创建 AI 对话 API 实例
 */
export function createAIAPI(
  pluginId: string,
  permissions: PermissionChecker,
  host: AIHost,
): AIAPI {
  return {
    async chat(message: string): Promise<string> {
      permissions.assertApiAccess("ai");
      return host.chat(pluginId, message);
    },

    onMessage(callback: MessageCallback): void {
      permissions.assertApiAccess("ai");
      host.onMessage(pluginId, callback);
    },
  };
}
