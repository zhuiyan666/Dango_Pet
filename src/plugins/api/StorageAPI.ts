/**
 * 数据存储 API (dango.storage)
 * 提供插件独立的持久化键值存储
 */

import type { PermissionChecker } from "../permissions";

/** 存储 API 接口 */
export interface StorageAPI {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

/** 存储前缀，用于隔离不同插件的数据 */
const STORAGE_PREFIX = "dango.plugin.";

/**
 * 创建数据存储 API 实例
 * 每个插件的数据通过 pluginId 前缀隔离
 */
export function createStorageAPI(
  pluginId: string,
  permissions: PermissionChecker,
): StorageAPI {
  const prefix = `${STORAGE_PREFIX}${pluginId}.`;

  function getFullKey(key: string): string {
    return `${prefix}${key}`;
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      permissions.assertApiAccess("storage");
      const raw = localStorage.getItem(getFullKey(key));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      permissions.assertApiAccess("storage");
      const serialized = JSON.stringify(value);
      localStorage.setItem(getFullKey(key), serialized);
    },

    async remove(key: string): Promise<void> {
      permissions.assertApiAccess("storage");
      localStorage.removeItem(getFullKey(key));
    },

    async keys(): Promise<string[]> {
      permissions.assertApiAccess("storage");
      const result: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey?.startsWith(prefix)) {
          result.push(fullKey.slice(prefix.length));
        }
      }
      return result;
    },

    async clear(): Promise<void> {
      permissions.assertApiAccess("storage");
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey?.startsWith(prefix)) {
          keysToRemove.push(fullKey);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    },
  };
}
