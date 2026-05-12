/**
 * 行走行为
 * 控制宠物在窗口内随机行走，包括边界碰撞和攀墙效果
 */

import type { BehaviorConfig, Vec2 } from "@/types";

/** 行走行为更新结果 */
interface WalkUpdateResult {
  position: Vec2;
  facing: 1 | -1;
  finished: boolean;
  hitWall: boolean;
}

export class WalkBehavior {
  private config: BehaviorConfig;
  /** 行走方向向量 */
  private direction: Vec2 = { x: 0, y: 0 };
  /** 行走开始时间 */
  private startTime = 0;
  /** 行走持续时间 */
  private duration = 0;
  /** 是否已进入行为 */
  private active = false;
  /** 是否正在攀墙 */
  private climbing = false;
  /** 攀墙计时器 */
  private climbTimer = 0;

  constructor(config: BehaviorConfig) {
    this.config = config;
  }

  /**
   * 进入行走行为
   */
  enter(_position: Vec2, facing: 1 | -1): void {
    this.active = true;
    this.startTime = performance.now();
    this.duration = this.randomBetween(this.config.walkMinDuration, this.config.walkMaxDuration);
    this.climbing = false;
    this.climbTimer = 0;

    // 随机生成行走方向
    this.randomizeDirection(facing);
  }

  /**
   * 退出行走行为
   */
  exit(): void {
    this.active = false;
    this.climbing = false;
  }

  /**
   * 每帧更新
   */
  update(
    timestamp: number,
    position: Vec2,
    facing: 1 | -1,
    delta: number,
  ): WalkUpdateResult {
    if (!this.active) {
      return { position, facing, finished: true, hitWall: false };
    }

    // 攀墙动画处理
    if (this.climbing) {
      this.climbTimer -= delta * 1000;
      if (this.climbTimer <= 0) {
        this.climbing = false;
        // 攀墙结束，反向行走
        this.direction.x = -this.direction.x;
      }
      return { position, facing, finished: false, hitWall: true };
    }

    // 检查行走是否结束
    if (timestamp - this.startTime > this.duration) {
      return { position, facing, finished: true, hitWall: false };
    }

    // 计算新位置
    const speed = this.config.walkSpeed;
    const newPos: Vec2 = {
      x: position.x + this.direction.x * speed * delta,
      y: position.y + this.direction.y * speed * delta,
    };

    // 边界检测
    let hitWall = false;
    const halfW = this.config.petWidth;
    const halfH = this.config.petHeight;

    // 左右边界
    if (newPos.x <= 0) {
      newPos.x = 0;
      hitWall = true;
    } else if (newPos.x >= this.config.windowWidth - halfW) {
      newPos.x = this.config.windowWidth - halfW;
      hitWall = true;
    }

    // 上下边界
    if (newPos.y <= 0) {
      newPos.y = 0;
      hitWall = true;
    } else if (newPos.y >= this.config.windowHeight - halfH) {
      newPos.y = this.config.windowHeight - halfH;
      hitWall = true;
    }

    // 碰到墙壁触发攀墙行为
    if (hitWall) {
      this.climbing = true;
      this.climbTimer = 600; // 攀墙持续 600ms
    }

    // 根据移动方向更新朝向
    const newFacing: 1 | -1 = this.direction.x >= 0 ? 1 : -1;

    return {
      position: newPos,
      facing: newFacing,
      finished: false,
      hitWall,
    };
  }

  /**
   * 随机生成行走方向
   */
  private randomizeDirection(currentFacing: 1 | -1): void {
    // 随机角度（-60° 到 60° 之间，偏水平方向行走）
    const angle = (Math.random() - 0.5) * (Math.PI / 1.5);
    // 70% 概率保持当前朝向
    const dir = Math.random() < 0.7 ? currentFacing : (currentFacing * -1) as 1 | -1;

    this.direction = {
      x: Math.cos(angle) * dir,
      y: Math.sin(angle) * 0.3, // 垂直分量较小，以水平为主
    };

    // 归一化
    const len = Math.sqrt(this.direction.x ** 2 + this.direction.y ** 2);
    if (len > 0) {
      this.direction.x /= len;
      this.direction.y /= len;
    }
  }

  /**
   * 生成随机数
   */
  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
