/**
 * 插件 Manifest 解析与验证
 * 负责解析 manifest.json 并验证其合法性
 */

import type { Permission } from "./permissions";
import { validatePermissions } from "./permissions";

/** 插件 Manifest 结构 */
export interface PluginManifest {
  /** 插件唯一标识符（如 "com.example.my-plugin"） */
  id: string;
  /** 插件显示名称 */
  name: string;
  /** 插件版本号（semver） */
  version: string;
  /** 插件描述 */
  description: string;
  /** 插件作者 */
  author: string;
  /** 入口文件名（相对于插件目录） */
  entry: string;
  /** 所需权限列表 */
  permissions: Permission[];
  /** 最低应用版本要求 */
  minAppVersion?: string;
}

/** Manifest 验证结果 */
export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: PluginManifest;
}

/**
 * 解析并验证 manifest JSON 字符串
 */
export function parseManifest(json: string): ManifestValidationResult {
  const errors: string[] = [];

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { valid: false, errors: ["manifest.json 不是有效的 JSON"] };
  }

  // 必填字段验证
  const requiredFields = ["id", "name", "version", "description", "author", "entry"];
  for (const field of requiredFields) {
    if (!raw[field] || typeof raw[field] !== "string") {
      errors.push(`缺少必填字段或字段类型错误: "${field}"（应为字符串）`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ID 格式验证（推荐使用反向域名格式）
  const id = raw.id as string;
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(id)) {
    errors.push(`插件 ID "${id}" 格式不合法，建议使用反向域名格式（如 "com.example.plugin"）`);
  }

  // 版本号验证（简单 semver 检查）
  const version = raw.version as string;
  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(version)) {
    errors.push(`版本号 "${version}" 格式不合法，建议使用 semver 格式（如 "1.0.0"）`);
  }

  // 权限验证
  const permissions = Array.isArray(raw.permissions) ? (raw.permissions as string[]) : [];
  const permResult = validatePermissions(permissions);
  if (!permResult.valid) {
    errors.push(...permResult.errors);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const manifest: PluginManifest = {
    id: id,
    name: raw.name as string,
    version: version,
    description: raw.description as string,
    author: raw.author as string,
    entry: raw.entry as string,
    permissions: permissions as Permission[],
    minAppVersion: raw.minAppVersion as string | undefined,
  };

  return { valid: true, errors: [], manifest };
}

/**
 * 验证插件版本兼容性
 */
export function checkVersionCompatibility(
  pluginMinVersion: string | undefined,
  appVersion: string,
): { compatible: boolean; reason?: string } {
  if (!pluginMinVersion) {
    return { compatible: true };
  }

  const parseVer = (v: string) => {
    const parts = v.split(".").map(Number);
    return { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };
  };

  const min = parseVer(pluginMinVersion);
  const app = parseVer(appVersion);

  if (min.major > app.major) return { compatible: false, reason: `需要 v${pluginMinVersion}，当前 v${appVersion}` };
  if (min.major === app.major && min.minor > app.minor)
    return { compatible: false, reason: `需要 v${pluginMinVersion}，当前 v${appVersion}` };
  if (min.major === app.major && min.minor === app.minor && min.patch > app.patch)
    return { compatible: false, reason: `需要 v${pluginMinVersion}，当前 v${appVersion}` };

  return { compatible: true };
}
