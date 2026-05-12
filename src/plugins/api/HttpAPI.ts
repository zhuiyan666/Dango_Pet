/**
 * 网络 API (dango.http)
 * 提供 HTTP 请求能力，需要 network 权限
 */

import type { PermissionChecker } from "../permissions";

/** 请求选项 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

/** 响应对象 */
export interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  text: string;
}

/** 网络 API 接口 */
export interface HttpAPI {
  get(url: string, options?: RequestOptions): Promise<HttpResponse>;
  post(url: string, body: unknown, options?: RequestOptions): Promise<HttpResponse>;
}

/**
 * 创建网络 API 实例
 */
export function createHttpAPI(
  _pluginId: string,
  permissions: PermissionChecker,
): HttpAPI {
  async function request(
    url: string,
    method: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<HttpResponse> {
    permissions.assertApiAccess("http");

    const controller = new AbortController();
    const timeout = options?.timeout ?? 10000;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        signal: controller.signal,
      };

      if (body !== undefined && method !== "GET") {
        fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const res = await fetch(url, fetchOptions);
      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      // 解析响应头
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        headers,
        data,
        text,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async get(url: string, options?: RequestOptions): Promise<HttpResponse> {
      return request(url, "GET", undefined, options);
    },

    async post(url: string, body: unknown, options?: RequestOptions): Promise<HttpResponse> {
      return request(url, "POST", body, options);
    },
  };
}
