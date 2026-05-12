/**
 * 插件 API 总入口
 * 聚合 6 个 API 模块，提供统一的 dango 命名空间
 */

import type { PermissionChecker } from "../permissions";
import { createPetAPI, type PetAPI, type PetHost } from "./PetAPI";
import { createUIAPI, type UIAPI, type UIHost } from "./UIAPI";
import { createStorageAPI, type StorageAPI } from "./StorageAPI";
import { createEventsAPI, type EventsAPI, type EventsHost } from "./EventsAPI";
import { createHttpAPI, type HttpAPI } from "./HttpAPI";
import { createAIAPI, type AIAPI, type AIHost } from "./AIAPI";

export type { PetAPI, PetHost, PetStateInfo } from "./PetAPI";
export type { UIAPI, UIHost, PanelOptions } from "./UIAPI";
export type { StorageAPI } from "./StorageAPI";
export type { EventsAPI, EventsHost } from "./EventsAPI";
export type { HttpAPI, RequestOptions, HttpResponse } from "./HttpAPI";
export type { AIAPI, AIHost } from "./AIAPI";

/** dango 命名空间 — 插件可访问的全部 API */
export interface DangoAPI {
  pet: PetAPI;
  ui: UIAPI;
  storage: StorageAPI;
  events: EventsAPI;
  http: HttpAPI;
  ai: AIAPI;
}

/** API 宿主接口 — 应用层需提供的全部宿主实现 */
export interface APIHosts {
  pet: PetHost;
  ui: UIHost;
  events: EventsHost;
  ai: AIHost;
}

/**
 * 创建完整的 dango API 实例
 * 根据插件权限动态构建 API 代理
 *
 * @param pluginId 插件 ID
 * @param permissions 权限检查器
 * @param hosts 宿主实现集合
 */
export function createDangoAPI(
  pluginId: string,
  permissions: PermissionChecker,
  hosts: APIHosts,
): DangoAPI {
  return {
    pet: createPetAPI(pluginId, permissions, hosts.pet),
    ui: createUIAPI(pluginId, permissions, hosts.ui),
    storage: createStorageAPI(pluginId, permissions),
    events: createEventsAPI(pluginId, permissions, hosts.events),
    http: createHttpAPI(pluginId, permissions),
    ai: createAIAPI(pluginId, permissions, hosts.ai),
  };
}
