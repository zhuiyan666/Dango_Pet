/**
 * 待机行为
 * 处理宠物的空闲/待机状态，计时触发状态切换
 */

import type { BehaviorConfig } from "@/types";

export class IdleBehavior {
  private config: BehaviorConfig;
  /** 进入 idle 的时间 */
  private enterTime = 0;
  /** 下一次切换到 walk 的延迟 */
  private nextWalkDelay = 0;
  /** 是否已进入行为 */
  private active = false;
  /** 累计空闲时间（用于 sleep 检测） */
  private totalIdleTime = 0;

  constructor(config: BehaviorConfig) {
    this.config = config;
  }

  /**
   * 进入 idle 行为
   */
  enter(): void {
    this.active = true;
    this.enterTime = performance.now();
    this.nextWalkDelay = this.randomBetween(
      this.config.idleToWalkMinDelay,
      this.config.idleToWalkMaxDelay,
    );
    this.totalIdleTime = 0;
  }

  /**
   * 退出 idle 行为
   */
  exit(): void {
    this.active = false;
  }

  /**
   * 每帧更新
   * @returns 是否应该切换到 walk
   */
  update(timestamp: number): boolean {
    if (!this.active) return false;

    const idleDuration = timestamp - this.enterTime;
    this.totalIdleTime += idleDuration;

    // 检查是否应该切换到 walk
    if (idleDuration > this.nextWalkDelay) {
      return true;
    }

    return false;
  }

  /**
   * 是否空闲过久（应进入 sleep）
   */
  shouldSleep(): boolean {
    return this.totalIdleTime > this.config.idleToSleepTimeout;
  }

  /**
   * 生成随机数
   */
  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
