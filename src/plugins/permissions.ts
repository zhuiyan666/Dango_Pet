/**
 * 插件权限定义与检查
 * 细粒度权限控制，插件只能访问 manifest 中声明的权限
 */

/** 所有可用权限 */
export type Permission =
  | "network"       // HTTP 网络请求
  | "storage"       // 数据持久化存储
  | "pet:control"   // 宠物行为控制
  | "ui:render"     // UI 渲染（面板、气泡、菜单）
  | "events:system" // 系统事件监听
  | "ai:chat";      // AI 对话

/** 权限描述信息 */
export interface PermissionInfo {
  id: Permission;
  name: string;
  description: string;
  /** 该权限对应的 API 模块 */
  apiModules: string[];
}

/** 全部权限定义 */
export const PERMISSION_DEFINITIONS: PermissionInfo[] = [
  {
    id: "network",
    name: "网络访问",
    description: "允许插件发送 HTTP 请求",
    apiModules: ["http"],
  },
  {
    id: "storage",
    name: "数据存储",
    description: "允许插件持久化存储数据",
    apiModules: ["storage"],
  },
  {
    id: "pet:control",
    name: "宠物控制",
    description: "允许插件控制宠物动画、位置和行为",
    apiModules: ["pet"],
  },
  {
    id: "ui:render",
    name: "UI 渲染",
    description: "允许插件显示自定义面板、气泡和菜单项",
    apiModules: ["ui"],
  },
  {
    id: "events:system",
    name: "系统事件",
    description: "允许插件监听鼠标、键盘、定时器等系统事件",
    apiModules: ["events"],
  },
  {
    id: "ai:chat",
    name: "AI 对话",
    description: "允许插件接入 AI 对话能力",
    apiModules: ["ai"],
  },
];

/** API 模块到所需权限的映射 */
const API_MODULE_PERMISSIONS: Record<string, Permission> = {
  pet: "pet:control",
  ui: "ui:render",
  storage: "storage",
  events: "events:system",
  http: "network",
  ai: "ai:chat",
};

/**
 * 权限检查器
 */
export class PermissionChecker {
  private permissions: Set<Permission>;

  constructor(permissions: Permission[]) {
    this.permissions = new Set(permissions);
  }

  /**
   * 检查是否拥有指定权限
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions.has(permission);
  }

  /**
   * 检查是否拥有访问某个 API 模块的权限
   * 如果该模块不需要权限（如 core），直接返回 true
   */
  checkApiAccess(apiModule: string): boolean {
    const required = API_MODULE_PERMISSIONS[apiModule];
    // 未映射的模块视为公开 API，无需权限
    if (!required) return true;
    return this.permissions.has(required);
  }

  /**
   * 断言权限，未授权时抛出错误
   */
  assertPermission(permission: Permission): void {
    if (!this.permissions.has(permission)) {
      throw new Error(`权限不足: 需要 "${permission}" 权限，请在 manifest.json 中声明`);
    }
  }

  /**
   * 断言 API 访问权限
   */
  assertApiAccess(apiModule: string): void {
    const required = API_MODULE_PERMISSIONS[apiModule];
    if (!required) return;
    this.assertPermission(required);
  }

  /**
   * 获取已授权的权限列表
   */
  getGrantedPermissions(): Permission[] {
    return Array.from(this.permissions);
  }
}

/**
 * 验证权限列表是否合法
 */
export function validatePermissions(permissions: string[]): {
  valid: boolean;
  errors: string[];
} {
  const validPermissions = new Set(PERMISSION_DEFINITIONS.map((p) => p.id));
  const errors: string[] = [];

  for (const perm of permissions) {
    if (!validPermissions.has(perm as Permission)) {
      errors.push(`未知权限: "${perm}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}
