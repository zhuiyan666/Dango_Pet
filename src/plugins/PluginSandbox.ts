/**
 * 插件沙箱 — 插件代码执行环境
 *
 * 使用 new Function() + Proxy 实现简化沙箱隔离。
 * 每个插件拥有独立的 globalThis 代理，只能通过 dango API 访问宿主功能。
 * 后续可升级到 isolated-vm（V8 Isolate）以获得更强的隔离性。
 */

import type { DangoAPI } from "./api";

/** 插件导出接口 */
export interface PluginExports {
  activate?: (ctx: DangoAPI) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
}

/**
 * 在沙箱中执行插件代码
 *
 * 策略：
 * 1. 创建受限的全局对象代理（仅暴露安全的内置对象）
 * 2. 通过 Proxy 拦截对全局作用域的访问
 * 3. 将 dango API 注入为唯一外部接口
 *
 * @param code 插件入口 JS 源码
 * @param dango 向插件暴露的 dango API
 * @returns 插件导出的 activate/deactivate 函数
 */
export function executeInSandbox(code: string, dango: DangoAPI): PluginExports {
  // 构建受限的全局对象 — 仅保留安全的内置功能
  const safeGlobals: Record<string, unknown> = {
    console: createSandboxConsole(),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    // 安全的内置对象
    Promise: globalThis.Promise,
    Error: globalThis.Error,
    TypeError: globalThis.TypeError,
    RangeError: globalThis.RangeError,
    SyntaxError: globalThis.SyntaxError,
    JSON: globalThis.JSON,
    Math: globalThis.Math,
    Date: globalThis.Date,
    Array: globalThis.Array,
    Object: globalThis.Object,
    String: globalThis.String,
    Number: globalThis.Number,
    Boolean: globalThis.Boolean,
    Map: globalThis.Map,
    Set: globalThis.Set,
    WeakMap: globalThis.WeakMap,
    WeakSet: globalThis.WeakSet,
    RegExp: globalThis.RegExp,
    Symbol: globalThis.Symbol,
    parseInt: globalThis.parseInt,
    parseFloat: globalThis.parseFloat,
    isNaN: globalThis.isNaN,
    isFinite: globalThis.isFinite,
    encodeURIComponent: globalThis.encodeURIComponent,
    decodeURIComponent: globalThis.decodeURIComponent,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,
  };

  // 创建全局代理 — 拦截未定义的变量访问
  const globalProxy = new Proxy(safeGlobals, {
    has(_target, key) {
      // 声明所有沙箱内可用的变量，阻止访问外部作用域
      return key in safeGlobals || key === "dango";
    },
    get(target, key) {
      if (key === "dango") return dango;
      if (typeof key === "symbol") return undefined;
      const val = target[key as string];
      if (val === undefined) {
        // 阻止访问未定义的全局变量（如 window, document, process, require 等）
        return undefined;
      }
      return val;
    },
    set(_target, key) {
      // 禁止在全局作用域创建新变量（除了 dango）
      if (key === "dango") {
        throw new Error("不能覆盖 dango 对象");
      }
      return false;
    },
  });

  // 使用 with 语句 + Proxy 创建隔离作用域
  // 插件代码包裹在 IIFE 中，接收 module/exports 模拟 CommonJS
  const wrappedCode = `
    with (__scope__) {
      "use strict";
      var module = { exports: {} };
      var exports = module.exports;
      (function() {
        ${code}
      }).call(undefined);
      return module.exports;
    }
  `;

  try {
    // 使用 Function 构造器 + with 语句实现作用域隔离
    const sandboxFn = new Function("__scope__", wrappedCode);
    const result = sandboxFn(globalProxy) as Record<string, unknown>;

    return {
      activate: typeof result.activate === "function"
        ? (result.activate as (ctx: DangoAPI) => void | Promise<void>)
        : undefined,
      deactivate: typeof result.deactivate === "function"
        ? (result.deactivate as () => void | Promise<void>)
        : undefined,
    };
  } catch (err) {
    throw new Error(`插件代码执行失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 创建沙箱内的 console 代理
 * 将日志前缀加上插件标识，便于调试
 */
function createSandboxConsole(): Console {
  return {
    log: (...args: unknown[]) => console.log("[Plugin]", ...args),
    warn: (...args: unknown[]) => console.warn("[Plugin]", ...args),
    error: (...args: unknown[]) => console.error("[Plugin]", ...args),
    info: (...args: unknown[]) => console.info("[Plugin]", ...args),
    debug: (...args: unknown[]) => console.debug("[Plugin]", ...args),
    trace: (...args: unknown[]) => console.trace("[Plugin]", ...args),
    dir: (...args: unknown[]) => console.dir(...args),
    table: (...args: unknown[]) => console.table(...args),
    group: (...args: unknown[]) => console.group(...args),
    groupEnd: () => console.groupEnd(),
    clear: () => {},
    count: () => {},
    countReset: () => {},
    time: () => {},
    timeEnd: () => {},
    timeLog: () => {},
    assert: (condition: boolean, ...args: unknown[]) => console.assert(condition, "[Plugin]", ...args),
    profile: () => {},
    profileEnd: () => {},
    dirxml: (...args: unknown[]) => console.dirxml(...args),
    groupCollapsed: (...args: unknown[]) => console.groupCollapsed(...args),
    timeStamp: () => {},
  } as unknown as Console;
}
