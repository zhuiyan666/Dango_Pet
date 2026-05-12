# 桌面宠物渲染方案调研

## 渲染方案对比

### 1. 2D 精灵图动画
- **实现**: PNG 序列帧 / Sprite Sheet + 动画状态机
- **视觉效果**: 像素风或手绘风，风格化强
- **性能**: 极低开销（GPU 加速 2D 渲染）
- **内容创作**: 简单，可用 Aseprite / Photoshop 制作
- **社区**: 最成熟，大量免费素材
- **代表**: Shimeji, Desktop Goose
- **评分**: ⭐⭐⭐⭐⭐ (最适合桌面宠物)

### 2. Live2D
- **实现**: Live2D Cubism SDK，网格变形动画
- **视觉效果**: 高质量 2D 角色动画，自然的表情和动作
- **性能**: 中等（需要 GPU 加速）
- **内容创作**: 需要专业工具（Live2D Cubism Editor），门槛高
- **社区**: VTuber 生态成熟
- **代表**: VTuber 软件、部分桌面伴侣
- **评分**: ⭐⭐⭐⭐ (视觉效果好但创作门槛高)

### 3. Spine 2D
- **实现**: Spine 运行时，骨骼动画系统
- **视觉效果**: 流畅的 2D 骨骼动画
- **性能**: 低开销
- **内容创作**: 需要 Spine Editor（商业授权）
- **社区**: 游戏行业广泛使用
- **评分**: ⭐⭐⭐ (商业授权是障碍)

### 4. 3D 模型
- **实现**: Three.js / Babylon.js + glTF 模型
- **视觉效果**: 3D 角色，可 360° 旋转
- **性能**: 较高开销（GPU 密集）
- **内容创作**: 需要 3D 建模技能（Blender 等）
- **社区**: 模型资源丰富（VRM 格式）
- **代表**: Desktop Mate, VRM 桌面应用
- **评分**: ⭐⭐⭐ (资源开销大，但差异化强)

### 5. HTML/CSS/Canvas
- **实现**: Web 技术栈渲染
- **视觉效果**: 灵活，但难以达到专业动画效果
- **性能**: 中等
- **内容创作**: Web 开发者友好
- **评分**: ⭐⭐ (不适合高质量动画)

## 透明窗口技术分析

### Windows 平台
- **Electron**: `transparent: true` + `frame: false` + `setIgnoreMouseEvents`
- **Tauri v2**: `transparent: true` + `decorations: false` + `set_ignore_cursor_events`
- **原生**: Win32 `WS_EX_LAYERED` + `WS_EX_TRANSPARENT`
- **注意事项**: 
  - Windows 上透明窗口与 DWM 合成器有兼容性问题
  - 部分显卡驱动可能导致透明区域变黑
  - 需要 `SetWindowLong` 处理点击穿透

### macOS 平台
- **Electron**: `transparent: true` + `titleBarStyle: 'custom'`
- **Tauri v2**: `transparent: true` + `decorations: false`
- **原生**: NSWindow `backgroundColor = .clear` + `isOpaque = false`
- **注意事项**: macOS 透明窗口支持更好，但 Retina 显示需要处理缩放

### 跨平台透明窗口最佳实践
1. 使用 PNG 图片的 Alpha 通道定义可见区域
2. 鼠标事件穿透：非宠物区域点击传递到下层窗口
3. 窗口层级：`alwaysOnTop` 但不遮挡全屏应用
4. 多显示器：宠物跟随主显示器或可拖拽到任意屏幕

## 框架对比（桌面宠物场景）

| 维度 | Tauri v2 | Electron | 原生 (Qt/Win32) |
|------|----------|----------|----------------|
| **内存占用** | ~10-30MB | ~100-200MB | ~5-20MB |
| **包大小** | ~5-10MB | ~150MB+ | ~5-15MB |
| **透明窗口** | ✅ 支持 | ✅ 成熟 | ✅ 最佳 |
| **Web 渲染** | ✅ WebView2 | ✅ Chromium | ❌ 需嵌入 |
| **插件生态** | 中等 | 极强 | 弱 |
| **开发效率** | 高 | 高 | 低 |
| **跨平台** | ✅ Win/Mac/Linux | ✅ Win/Mac/Linux | 需分别实现 |
| **安全性** | 高（Rust 后端） | 中（Node.js） | 高 |

## 推荐

**首选: Tauri v2** — 内存占用小、安全性高、支持透明窗口、Rust 后端天然适合插件沙箱。
**备选: Electron** — 生态成熟、社区资源多，但内存开销大。
