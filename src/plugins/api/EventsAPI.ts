/**
 * 系统事件 API (dango.events)
 * 提供鼠标、键盘、定时器等系统事件的订阅能力
 */

import type { PermissionChecker } from "../permissions";

/** 事件回调函数类型 */
type EventCallback = (...args: unknown[]) => void;

/** 事件 API 接口 */
export interface EventsAPI {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
}

/** 事件宿主接口 — 由应用层提供事件分发能力 */
export interface EventsHost {
  on(pluginId: string, event: string, callback: EventCallback): void;
  off(pluginId: string, event: string, callback: EventCallback): void;
}

/**
 * 创建系统事件 API 实例
 */
export function createEventsAPI(
  pluginId: string,
  permissions: PermissionChecker,
  host: EventsHost,
): EventsAPI {
  return {
    on(event: string, callback: EventCallback): void {
      permissions.assertApiAccess("events");
      host.on(pluginId, event, callback);
    },

    off(event: string, callback: EventCallback): void {
      permissions.assertApiAccess("events");
      host.off(pluginId, event, callback);
    },
  };
}
