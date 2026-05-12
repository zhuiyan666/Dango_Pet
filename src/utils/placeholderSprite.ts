/**
 * 占位精灵图生成器
 * 在真实精灵图素材就绪前，程序化生成测试用精灵图
 * 每帧绘制一个带表情的圆形团子，用于验证渲染管线
 */

/**
 * 绘制圆角矩形辅助函数
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * 绘制团子基础身体
 */
function drawBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  cx: number,
  cy: number,
  size: number,
  bounceOffset: number,
  color: string,
): void {
  // 身体（圆角矩形）
  ctx.fillStyle = color;
  roundRect(ctx, x + 16, cy - 30 + bounceOffset, size - 32, 60, 20);
  ctx.fill();

  // 阴影
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 34, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 腮红
  ctx.fillStyle = "rgba(255,150,150,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx - 18, cy + 2 + bounceOffset, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 18, cy + 2 + bounceOffset, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 绘制团子眼睛
 */
function drawEyes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bounceOffset: number,
  frameIndex: number,
  totalFrames: number,
  style: "normal" | "blink" | "sleepy" | "happy" | "wide",
): void {
  ctx.fillStyle = "#333";

  if (style === "blink" || (style === "normal" && frameIndex === Math.floor(totalFrames * 0.6))) {
    // 眨眼 — 水平线
    ctx.fillRect(cx - 14, cy - 6 + bounceOffset, 8, 2);
    ctx.fillRect(cx + 6, cy - 6 + bounceOffset, 8, 2);
  } else if (style === "sleepy") {
    // 困倦 — 半闭眼
    ctx.fillRect(cx - 14, cy - 4 + bounceOffset, 8, 2);
    ctx.fillRect(cx + 6, cy - 4 + bounceOffset, 8, 2);
  } else if (style === "happy") {
    // 开心 — 弧线
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#333";
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 4 + bounceOffset, 4, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 4 + bounceOffset, 4, Math.PI, 0);
    ctx.stroke();
  } else if (style === "wide") {
    // 睁大眼 — 圆点（更大）
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 6 + bounceOffset, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 6 + bounceOffset, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 正常 — 圆点
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 6 + bounceOffset, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 6 + bounceOffset, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 绘制团子嘴巴
 */
function drawMouth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bounceOffset: number,
  style: "smile" | "open" | "sleep" | "o" | "flat",
): void {
  ctx.strokeStyle = "#333";
  ctx.fillStyle = "#333";
  ctx.lineWidth = 2;

  if (style === "smile") {
    ctx.beginPath();
    ctx.arc(cx, cy + 6 + bounceOffset, 6, 0, Math.PI);
    ctx.stroke();
  } else if (style === "open") {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8 + bounceOffset, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "sleep") {
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 8 + bounceOffset);
    ctx.lineTo(cx + 4, cy + 8 + bounceOffset);
    ctx.stroke();
  } else if (style === "o") {
    ctx.beginPath();
    ctx.arc(cx, cy + 8 + bounceOffset, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 6 + bounceOffset);
    ctx.lineTo(cx + 5, cy + 6 + bounceOffset);
    ctx.stroke();
  }
}

/**
 * 生成占位精灵图（4 帧 idle 动画）
 * 返回一个 HTMLCanvasElement，可用作 spriteImage
 */
export function createIdlePlaceholder(frames: number = 4, size: number = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size * frames;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  for (let i = 0; i < frames; i++) {
    const x = i * size;
    const cx = x + size / 2;
    const cy = size / 2;

    const bounceOffset = Math.sin((i / frames) * Math.PI * 2) * 4;

    drawBody(ctx, x, cx, cy, size, bounceOffset, "#a8e6a3");
    drawEyes(ctx, cx, cy, bounceOffset, i, frames, "normal");
    drawMouth(ctx, cx, cy, bounceOffset, "smile");
  }

  return canvas;
}

/**
 * 生成行走占位精灵图（6 帧）
 * 团子身体左右摇摆，模拟行走
 */
export function createWalkPlaceholder(frames: number = 6, size: number = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size * frames;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  for (let i = 0; i < frames; i++) {
    const x = i * size;
    const cx = x + size / 2;
    const cy = size / 2;

    // 行走时身体上下弹跳 + 轻微左右摇摆
    const bounceOffset = Math.abs(Math.sin((i / frames) * Math.PI * 2)) * 6;
    const swayOffset = Math.sin((i / frames) * Math.PI * 2) * 3;

    drawBody(ctx, x + swayOffset, cx + swayOffset, cy, size, -bounceOffset, "#a8e6a3");
    drawEyes(ctx, cx + swayOffset, cy, -bounceOffset, i, frames, "normal");
    drawMouth(ctx, cx + swayOffset, cy, -bounceOffset, "smile");

    // 小脚丫动画
    ctx.fillStyle = "#8bc88a";
    const footY = cy + 30 - bounceOffset;
    const footSpread = Math.sin((i / frames) * Math.PI) * 8;
    ctx.beginPath();
    ctx.ellipse(cx - 10 - footSpread + swayOffset, footY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 10 + footSpread + swayOffset, footY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

/**
 * 生成睡觉占位精灵图（4 帧）
 * 团子闭眼 + Zzz 动画
 */
export function createSleepPlaceholder(frames: number = 4, size: number = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size * frames;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  for (let i = 0; i < frames; i++) {
    const x = i * size;
    const cx = x + size / 2;
    const cy = size / 2;

    const breatheOffset = Math.sin((i / frames) * Math.PI * 2) * 2;

    drawBody(ctx, x, cx, cy, size, breatheOffset, "#b8d8b8");
    drawEyes(ctx, cx, cy, breatheOffset, i, frames, "sleepy");
    drawMouth(ctx, cx, cy, breatheOffset, "sleep");

    // Zzz 浮动文字
    const zzAlpha = 0.3 + Math.sin((i / frames) * Math.PI * 2) * 0.3;
    ctx.fillStyle = `rgba(100, 140, 200, ${zzAlpha})`;
    ctx.font = "bold 14px sans-serif";
    const zOffset = (i / frames) * 12;
    ctx.fillText("z", cx + 22, cy - 20 - zOffset + breatheOffset);
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("z", cx + 30, cy - 30 - zOffset + breatheOffset);
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("z", cx + 36, cy - 38 - zOffset + breatheOffset);
  }

  return canvas;
}

/**
 * 生成交互占位精灵图（4 帧）
 * 团子开心表情 + 爱心
 */
export function createInteractPlaceholder(frames: number = 4, size: number = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size * frames;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  for (let i = 0; i < frames; i++) {
    const x = i * size;
    const cx = x + size / 2;
    const cy = size / 2;

    const bounceOffset = Math.sin((i / frames) * Math.PI * 3) * 5;

    drawBody(ctx, x, cx, cy, size, bounceOffset, "#c8f0c8");
    drawEyes(ctx, cx, cy, bounceOffset, i, frames, "happy");
    drawMouth(ctx, cx, cy, bounceOffset, "open");

    // 浮动小爱心
    const heartAlpha = 0.4 + Math.sin((i / frames) * Math.PI * 2) * 0.3;
    ctx.fillStyle = `rgba(255, 120, 150, ${heartAlpha})`;
    ctx.font = "16px sans-serif";
    const heartY = cy - 28 + Math.sin((i / frames) * Math.PI) * 6 + bounceOffset;
    ctx.fillText("♥", cx - 22, heartY);
    ctx.fillText("♥", cx + 16, heartY - 4);
  }

  return canvas;
}

/**
 * 生成拖拽挣扎占位精灵图（4 帧）
 * 团子惊恐表情 + 摇晃
 */
export function createDraggedPlaceholder(frames: number = 4, size: number = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size * frames;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  for (let i = 0; i < frames; i++) {
    const x = i * size;
    const cx = x + size / 2;
    const cy = size / 2;

    // 剧烈摇晃
    const shakeOffset = Math.sin((i / frames) * Math.PI * 4) * 6;

    drawBody(ctx, x + shakeOffset, cx + shakeOffset, cy, size, 0, "#c8e8c8");
    drawEyes(ctx, cx + shakeOffset, cy, 0, i, frames, "wide");
    drawMouth(ctx, cx + shakeOffset, cy, 0, "o");
  }

  return canvas;
}
