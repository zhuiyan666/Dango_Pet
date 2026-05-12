# 插件架构调研

## 主流桌面应用插件系统分析

### VS Code Extension API
- **加载方式**: Node.js 子进程（扩展主机进程）
- **隔离模型**: 进程级隔离，每个扩展运行在独立的 Extension Host 进程中
- **API 设计**: 严格的 API 表面（`vscode` namespace），通过 `contributes` 声明式注册
- **分发**: VS Code Marketplace，`.vsix` 包格式
- **插件语言**: JavaScript/TypeScript
- **启示**: 声明式 manifest + 严格 API 边界 = 稳定性保障

### Obsidian Plugin API
- **加载方式**: 同进程 JavaScript 加载
- **隔离模型**: 无隔离（共享进程），依赖代码审查保障安全
- **API 设计**: `Plugin` 基类 + `this.app` 访问核心功能
- **分发**: GitHub Releases + 社区插件市场
- **插件语言**: JavaScript/TypeScript
- **启示**: 简单但安全风险高，适合社区驱动的插件生态

### Blender Add-on System
- **加载方式**: Python 解释器嵌入
- **隔离模型**: 共享进程，Python 沙箱有限
- **API 设计**: `bpy` 模块，注册/注销模式
- **分发**: Blender Market（商业）+ extensions.blender.org（官方）
- **插件语言**: Python
- **启示**: 强大的 API 表面，但学习曲线陡峭

### Figma Plugin API
- **加载方式**: Web Worker 隔离
- **隔离模型**: Worker 级隔离，通过 `postMessage` 通信
- **API 设计**: 命令式 API + manifest 声明
- **分发**: Figma Community
- **插件语言**: JavaScript/TypeScript (浏览器环境)
- **启示**: Web Worker 隔离是轻量级且安全的方案

## 插件隔离方案对比

| 方案 | 隔离级别 | 性能 | 语言支持 | 安全性 | 开发体验 |
|------|---------|------|---------|--------|---------|
| **WASM 沙箱** | 强（内存隔离） | 接近原生 | 多语言 | 极高 | 中等 |
| **Web Worker** | 中（线程隔离） | 好 | JS/TS | 高 | 好 |
| **子进程** | 强（进程隔离） | 中等 | 任意 | 高 | 复杂 |
| **共享进程** | 无 | 最好 | JS/TS | 低 | 最好 |
| **V8 Isolate** | 中（VM 隔离） | 好 | JS/TS | 高 | 好 |

## 推荐方案

### 方案 A: V8 Isolate + JS/TS 插件（推荐）
- 使用 `isolated-vm` 或类似库为每个插件创建独立 V8 隔离区
- 插件用 JS/TS 编写，降低开发门槛
- 通过定义良好的 API 桥接访问核心功能
- 类似 Cloudflare Workers 的隔离模型
- **优点**: 安全、性能好、开发者友好
- **缺点**: 仅支持 JS/TS

### 方案 B: WASM 插件 + JS 桥接
- 核心功能通过 WASM 暴露，插件编译为 WASM 模块
- 支持 Rust/Go/C++ 等多语言插件
- **优点**: 最安全、多语言支持
- **缺点**: 开发门槛高、调试困难

### 方案 C: 子进程插件
- 每个插件作为独立子进程运行
- 通过 IPC 通信
- **优点**: 最强隔离、崩溃不影响主进程
- **缺点**: 资源开销大、通信延迟

## 关键设计要素

1. **Manifest 声明**: 插件通过 JSON/YAML manifest 声明能力、权限、依赖
2. **生命周期管理**: activate / deactivate / dispose 三阶段
3. **权限系统**: 细粒度权限控制（网络、文件系统、系统信息等）
4. **版本兼容**: API 版本号 + 向后兼容承诺
5. **热更新**: 支持插件热加载/卸载，无需重启宿主
