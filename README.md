# 团子 Dango — 桌面宠物

一个可扩展的桌面宠物应用，内置 AI 对话和插件系统。

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [Rust](https://www.rust-lang.org/tools/install) >= 1.70
- Windows 10/11（macOS 和 Linux 也支持）

### 安装

```bash
# 克隆仓库
git clone https://github.com/zhuiyan666/Dango_Pet.git
cd Dango_Pet

# 安装依赖
pnpm install
```

### 开发运行

```bash
pnpm tauri dev
```

首次运行需要编译 Rust 依赖，可能需要几分钟。之后启动会很快。

### 构建安装包

```bash
pnpm tauri build
```

构建产物在 `src-tauri/target/release/bundle/` 目录下。

---

## 功能说明

### 宠物交互

| 操作 | 效果 |
|------|------|
| 点击宠物 | 摸头反应 + 表情气泡 |
| 拖拽宠物 | 移动位置 |
| 双击宠物 | 打开 AI 对话 |
| 右键宠物 | 弹出菜单（设置/外观/插件） |
| 空闲时 | 宠物自主行走、打盹、追鼠标 |

### AI 对话

1. 右键宠物 → **设置**
2. 在 AI 配置中选择模型类型：
   - **OpenAI** — GPT-4o 等（需 API Key）
   - **Claude** — Claude 3.5 Sonnet（需 API Key）
   - **OpenAI 兼容** — DeepSeek、通义千问、智谱等（需配置 Base URL + API Key）
   - **Ollama** — 本地模型（Base URL 填 `http://localhost:11434/v1`）
3. 输入 API Key，保存配置
4. 双击宠物开始聊天

### 插件系统

插件放在应用数据目录的 `plugins/` 文件夹下：

```
~/.dango/plugins/
├── my-plugin/
│   ├── manifest.json   ← 插件声明
│   └── index.js        ← 插件代码
```

#### manifest.json 示例

```json
{
  "id": "com.example.my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件描述",
  "author": "作者",
  "entry": "index.js",
  "permissions": ["pet:control", "ui:render", "events:system"]
}
```

#### 插件代码示例

```javascript
// index.js
module.exports = {
  activate(dango) {
    // 每 10 秒说一句话
    dango.events.on("time:interval", () => {
      dango.pet.say("你好呀~", 3000);
    });
  },
  deactivate() {
    // 清理资源
  },
};
```

#### 可用 API

| API | 权限 | 方法 |
|-----|------|------|
| `dango.pet` | `pet:control` | `playAnimation()`, `moveTo()`, `say()`, `emote()`, `getState()`, `getPosition()` |
| `dango.ui` | `ui:render` | `showPanel()`, `closePanel()`, `showBubble()`, `registerMenuItem()`, `removeMenuItem()` |
| `dango.storage` | `storage` | `get()`, `set()`, `remove()`, `keys()`, `clear()` |
| `dango.events` | `events:system` | `on()`, `off()` |
| `dango.http` | `network` | `get()`, `post()` |
| `dango.ai` | `ai:chat` | `chat()`, `onMessage()` |

#### 事件类型

- `mouse:click` — 鼠标点击
- `mouse:move` — 鼠标移动
- `time:interval` — 定时触发
- `pet:stateChange` — 宠物状态变化

---

## 项目结构

```
src/
├── ai/                    # AI 对话系统
│   ├── providers/         # 模型适配器
│   └── prompts/           # 人格提示词
├── components/            # UI 组件
├── core/                  # 核心引擎
│   ├── renderer/          # 精灵图渲染
│   ├── animation/         # 动画状态机
│   └── behavior/          # 行为系统
├── hooks/                 # React Hooks
├── plugins/               # 插件系统
│   ├── api/               # 6 个 API 模块
│   └── examples/          # 示例插件
└── stores/                # 状态存储

src-tauri/                 # Rust 后端
├── src/lib.rs             # Tauri 命令和系统托盘
└── capabilities/          # 权限配置
```

---

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **后端**: Tauri v2 (Rust)
- **渲染**: Canvas 2D 精灵图动画
- **插件**: 沙箱隔离 (Proxy + Function)
- **AI**: 多模型支持 (OpenAI / Claude / Ollama)

---

## 许可证

MIT
