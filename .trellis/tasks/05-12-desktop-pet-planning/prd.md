# 团子 Dango — 桌面宠物产品规划与架构设计

## Goal

打造一个可上市的高质量桌面宠物产品（混合型定位）：以**创作者平台**为骨架（插件架构），内置 **AI 对话**作为核心亮点，同时设计有趣的默认行为保证**开箱即用**的娱乐体验。插件系统允许后续无限扩展功能。

## What I already know

* 项目目录：`E:\Code\ClaudeCode\Pet`，全新项目，无现有代码
* 用户目标：可上市（商业化）的桌面宠物，非个人玩具
* 核心需求：插件接口设计，支持后续持续扩展功能
* 已有 Trellis 管理框架可用

## Assumptions

* 首发平台 Windows，后续扩展 macOS
* 目标用户：18-35 岁，熟悉互联网产品，愿意为有趣的桌面伴侣付费
* 插件开发者画像：前端开发者为主，JS/TS 是最低门槛
* LLM API 成本由用户承担（自带 Key）或通过订阅覆盖

## Open Questions

所有关键决策已完成，无阻塞性 Open Questions。

### 决策记录
| 决策项 | 结果 |
|--------|------|
| 产品定位 | 混合型（平台 + AI + 娱乐） |
| 产品名称 | 团子 Dango |
| 技术框架 | Tauri v2（Rust + Web） |
| 渲染方案 | 混合（默认 2D，渲染器可插拔） |
| 插件架构 | V8 Isolate + JS/TS |
| 插件 API | 6 个模块全部纳入 MVP |
| LLM 策略 | 多模型支持（OpenAI/Claude/国产/Ollama） |
| 商业化 | 免费 + AI 订阅 + 插件市场抽成 |
| 交互形态 | 轻交互型（陪伴感为主） |
| MVP 离线降级 | AI 不可用时宠物仍有基础行为 |
| 插件市场 | 延后到 v0.2 |

## Requirements (evolving)

### 产品定位
* 混合型定位：创作者平台 + AI 伴侣 + 娱乐性
* 核心骨架为插件架构，支持无限扩展
* 内置 AI 对话能力（杀手级功能）
* 开箱即用的有趣默认行为

### 技术架构
* 技术框架：Tauri v2（Rust 后端 + Web 前端 WebView2）
* 跨平台支持（至少 Windows + macOS）
* 混合渲染方案：默认 2D 精灵图，渲染器可插拔（支持 Live2D/3D 扩展）
* 渲染抽象层设计，允许插件引入新的渲染后端
* 利用 Rust 后端实现安全的插件沙箱

### 插件系统
* 插件隔离：V8 Isolate（类 Cloudflare Workers 模型）
* 插件语言：JS/TS，通过 Rust ↔ JS 桥接层访问核心 API
* 插件生命周期：manifest 声明 → activate → deactivate → dispose
* 插件权限系统：细粒度权限控制（网络、文件、系统信息等）

### 商业化
* 基础免费 + AI 对话订阅（按量/月费） + 插件市场抽成
* AI 对话作为核心付费点（LLM 调用有真实成本）
* 插件市场作为生态增长引擎，平台抽成 30%

### MVP 范围 (v0.1)
* ✅ 2D 精灵图宠物 + 透明窗口 + 基础动画状态机（待机、行走、睡觉、互动）
* ✅ 插件系统骨架（V8 Isolate 加载、manifest 解析、生命周期）
* ✅ 插件 API 全套（6 个模块）：
  - 宠物控制 API：动画、位置、行为控制
  - UI 渲染 API：自定义面板、气泡、菜单项
  - 数据存储 API：插件独立持久化存储
  - 系统事件 API：鼠标、键盘、定时器等事件响应
  - 网络 API：HTTP 请求（需权限声明）
  - AI 对话 API：接入/自定义 AI 对话能力
* ✅ 内置 AI 对话功能（多模型支持：OpenAI / Claude / 国产模型 / Ollama）
* ✅ 统一 LLM 抽象层，用户可配置 API Key + 选择模型
* ✅ 付费版提供内置额度，免费版需自备 Key
* ✅ 离线降级：AI 不可用时宠物仍有完整的基础行为（行走、互动、自主玩耍）
* ✅ 基础设置界面（外观切换、开机自启、音量）
* ✅ 1-2 个示例插件（验证插件系统）
* ✅ 轻交互型默认行为：
  - 桌面自由行走、攀爬窗口边缘、偶尔打盹
  - 点击：摸头反应 / 弹出快捷菜单
  - 拖拽：可移动位置，被拖时挣扎动画
  - 双击：打开 AI 对话气泡
  - 右键菜单：设置、外观、插件管理
  - 空闲时自主玩耍（追鼠标、踢小球等）
* ❌ 插件市场/在线分发（延后到 v0.2，先用本地加载）
* ❌ Live2D/3D 渲染器（延后）
* ❌ 高级宠物行为（延后）

## Acceptance Criteria

* [x] 完成技术栈选型 → Tauri v2
* [x] 完成插件架构设计 → V8 Isolate + 6 模块 API
* [x] 完成商业化模式定义 → 免费 + AI 订阅 + 市场抽成
* [x] 完成 MVP 功能范围定义 → 已锁定
* [ ] 输出可执行的实施计划（下一步）

## Definition of Done

* PRD 完整且经过用户确认
* 技术方案经过调研并有依据
* 实施计划可拆分为具体开发任务

## Out of Scope (explicit)

* 插件市场/在线分发（v0.2）
* Live2D / 3D 渲染器（v0.2+）
* 社交功能、好友系统
* 移动端 companion app
* 插件签名和安全审计（v0.2）
* 多宠物同时运行
* 用户数据云同步

## Technical Notes

* 全新项目，无技术债务约束
* 需要调研主流桌面宠物产品（如 Desktop Goose, Shimeji, 等）
* 需要调研插件架构最佳实践（VS Code, Obsidian, Figma 等）

## Research References

* [`research/desktop-pet-market.md`](research/desktop-pet-market.md) — 市场产品分析：Desktop Goose、Shimeji、Desktop Mate 等，推荐混合型定位
* [`research/plugin-architecture.md`](research/plugin-architecture.md) — 插件架构对比：V8 Isolate、WASM、子进程等方案，推荐 V8 Isolate + JS/TS
* [`research/rendering-approaches.md`](research/rendering-approaches.md) — 渲染方案对比：2D 精灵图、Live2D、3D 等，Tauri vs Electron 框架对比
