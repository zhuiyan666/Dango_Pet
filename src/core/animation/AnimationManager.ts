/**
 * 动画状态管理器
 * 管理宠物的动画状态切换（idle、walk、sleep、interact 等）
 */

import type { AnimationClip, PetState } from "@/types";
import { SpriteRenderer } from "@/core/renderer/SpriteRenderer";

/** 状态转移规则：key 是当前状态，value 是可转移到的目标状态集合 */
const STATE_TRANSITIONS: Record<PetState, PetState[]> = {
  idle: ["walk", "sleep", "interact"],
  walk: ["idle", "interact"],
  sleep: ["idle"],
  interact: ["idle", "walk"],
};

export class AnimationManager {
  private renderer: SpriteRenderer;
  private currentState: PetState = "idle";
  private clipMap: Map<string, AnimationClip> = new Map();
  private sourceMap: Map<string, HTMLCanvasElement> = new Map();

  constructor(renderer: SpriteRenderer) {
    this.renderer = renderer;
  }

  /**
   * 注册动画片段
   */
  registerClip(clip: AnimationClip): void {
    this.clipMap.set(clip.name, clip);
  }

  /**
   * 注册程序化生成的精灵图源
   */
  registerSource(stateName: string, source: HTMLCanvasElement): void {
    this.sourceMap.set(stateName, source);
  }

  /**
   * 获取当前状态
   */
  getState(): PetState {
    return this.currentState;
  }

  /**
   * 切换到指定状态
   * 会检查状态转移是否合法
   */
  async transitionTo(targetState: PetState): Promise<boolean> {
    const allowed = STATE_TRANSITIONS[this.currentState];
    if (!allowed.includes(targetState)) {
      console.warn(
        `非法状态转移: ${this.currentState} → ${targetState}，允许的目标: [${allowed.join(", ")}]`,
      );
      return false;
    }

    const clip = this.clipMap.get(targetState);
    if (!clip) {
      console.warn(`未找到动画片段: ${targetState}`);
      return false;
    }

    this.currentState = targetState;

    // 优先使用程序化生成的精灵图源
    const programmaticSource = this.sourceMap.get(targetState);
    if (programmaticSource) {
      await this.renderer.playWithSource(clip, programmaticSource, () => {
        if (!clip.loop) {
          this.currentState = "idle";
          this.playIdleWithFallback();
        }
      });
    } else {
      await this.renderer.play(clip, () => {
        if (!clip.loop) {
          this.currentState = "idle";
          this.playIdleWithFallback();
        }
      });
    }

    return true;
  }

  /**
   * 播放 idle 动画（带 fallback）
   */
  private playIdleWithFallback(): void {
    const idleClip = this.clipMap.get("idle");
    if (!idleClip) return;

    const idleSource = this.sourceMap.get("idle");
    if (idleSource) {
      this.renderer.playWithSource(idleClip, idleSource);
    } else {
      this.renderer.play(idleClip);
    }
  }

  /**
   * 每帧更新
   */
  update(timestamp: number): void {
    this.renderer.update(timestamp);
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.renderer.destroy();
    this.clipMap.clear();
    this.sourceMap.clear();
  }
}
