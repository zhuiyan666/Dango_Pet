/**
 * 插件系统模块
 * 提供完整的插件加载、沙箱执行、生命周期管理和 API 桥接能力
 */

// 核心模块
export { PluginManager, type PluginStatus, type PluginInstance } from "./PluginManager";
export { loadPlugin, loadAllPlugins, getPluginsDirectory, scanPluginDirectories } from "./PluginLoader";
export { executeInSandbox, type PluginExports } from "./PluginSandbox";
export { parseManifest, checkVersionCompatibility, type PluginManifest, type ManifestValidationResult } from "./PluginManifest";
export { PermissionChecker, validatePermissions, PERMISSION_DEFINITIONS, type Permission, type PermissionInfo } from "./permissions";

// API 模块
export {
  createDangoAPI,
  type DangoAPI,
  type APIHosts,
  type PetAPI,
  type PetHost,
  type PetStateInfo,
  type UIAPI,
  type UIHost,
  type PanelOptions,
  type StorageAPI,
  type EventsAPI,
  type EventsHost,
  type HttpAPI,
  type RequestOptions,
  type HttpResponse,
  type AIAPI,
  type AIHost,
} from "./api";

// React 集成
export { PluginSystemProvider } from "./PluginSystemProvider";
export { usePluginSystem, type PluginSystemContextValue, type PluginPanel, type PluginMenuItem } from "./usePluginSystem";
export { getPetState, updatePetState, type PetStateSnapshot } from "./petStateStore";
