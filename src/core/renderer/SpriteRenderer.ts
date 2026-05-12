/**
 * 2D 精灵图渲染器
 * 负责在 Canvas 上绘制精灵图动画帧
 */

import type { AnimationClip, SpriteRendererConfig } from "@/types";

export class SpriteRenderer {
  private ctx: CanvasRenderingContext2D;
  private x: number;
  private y: number;
  private scale: number;

  /** 当前加载的精灵图（支持 Image 或程序化生成的 Canvas） */
  private spriteSource: HTMLImageElement | HTMLCanvasElement | null = null;
  /** 当前动画片段 */
  private currentClip: AnimationClip | null = null;
  /** 当前帧索引 */
  private currentFrame = 0;
  /** 帧间隔计时器 */
  private frameTimer = 0;
  /** 上一帧时间戳 */
  private lastTimestamp = 0;
  /** 动画是否播放中 */
  private playing = false;
  /** 动画完成回调 */
  private onComplete: (() => void) | null = null;

  constructor(config: SpriteRendererConfig) {
    const ctx = config.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("无法获取 Canvas 2D 上下文");
    }
    this.ctx = ctx;
    this.x = config.x;
    this.y = config.y;
    this.scale = config.scale;

    // 关闭图像平滑，保持像素风格清晰
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * 加载精灵图并开始播放动画
   * 支持从文件路径加载 Image，或直接使用程序化生成的 Canvas
   */
  async play(clip: AnimationClip, onComplete?: () => void): Promise<void> {
    // 如果是同一个动画且正在播放，跳过
    if (this.currentClip?.name === clip.name && this.playing) {
      return;
    }

    this.currentClip = clip;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.playing = true;
    this.onComplete = onComplete ?? null;

    // 加载精灵图
    if (!this.spriteSource || this.spriteSource instanceof HTMLImageElement && this.spriteSource.src !== new URL(clip.spriteSrc, window.location.origin).href) {
      this.spriteSource = await this.loadImage(clip.spriteSrc);
    }
  }

  /**
   * 直接设置精灵图源（用于程序化生成的 Canvas）
   * 跳过文件加载，立即开始播放
   */
  async playWithSource(
    clip: AnimationClip,
    source: HTMLCanvasElement,
    onComplete?: () => void,
  ): Promise<void> {
    this.currentClip = clip;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.playing = true;
    this.onComplete = onComplete ?? null;
    this.spriteSource = source;
  }

  /**
   * 停止当前动画
   */
  stop(): void {
    this.playing = false;
    this.currentFrame = 0;
  }

  /**
   * 更新位置
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置缩放比例
   */
  setScale(scale: number): void {
    this.scale = scale;
  }

  /**
   * 每帧更新 — 由外部 requestAnimationFrame 驱动
   */
  update(timestamp: number): void {
    if (!this.playing || !this.currentClip || !this.spriteSource) {
      return;
    }

    // 计算时间差
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // 帧间隔（毫秒）
    const frameDuration = 1000 / this.currentClip.fps;
    this.frameTimer += deltaTime;

    // 推进帧
    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrame++;

      // 动画结束处理
      if (this.currentFrame >= this.currentClip.frameCount) {
        if (this.currentClip.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.currentClip.frameCount - 1;
          this.playing = false;
          this.onComplete?.();
        }
      }
    }

    this.render();
  }

  /**
   * 绘制当前帧到 Canvas
   */
  private render(): void {
    if (!this.currentClip || !this.spriteSource) return;

    const { frameWidth, frameHeight } = this.currentClip;

    // 清除绘制区域
    this.ctx.clearRect(
      this.x,
      this.y,
      frameWidth * this.scale,
      frameHeight * this.scale,
    );

    // 精灵图中的源区域（水平排列的序列帧）
    const sx = this.currentFrame * frameWidth;
    const sy = 0;
    const sw = frameWidth;
    const sh = frameHeight;

    // Canvas 上的目标区域
    const dx = this.x;
    const dy = this.y;
    const dw = frameWidth * this.scale;
    const dh = frameHeight * this.scale;

    // 绘制
    this.ctx.drawImage(this.spriteSource, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  /**
   * 异步加载图片
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`加载精灵图失败: ${src}`));
      img.src = src;
    });
  }

  /**
   * 销毁渲染器，释放资源
   */
  destroy(): void {
    this.stop();
    this.spriteSource = null;
    this.currentClip = null;
  }
}
