/**
 * 行为控制器 — 宠物行为决策引擎
 * 管理行为状态转换、定时器和自主行为触发
 */

import type {
  BehaviorType,
  BehaviorConfig,
  BehaviorEvent,
  Vec2,
  MousePosition,
} from "@/types";
import { WalkBehavior } from "./WalkBehavior";
import { IdleBehavior } from "./IdleBehavior";
import { InteractBehavior } from "./InteractBehavior";

/** 默认行为配置 */
const DEFAULT_CONFIG: BehaviorConfig = {
  idleToWalkMinDelay: 3000,
  idleToWalkMaxDelay: 8000,
  walkMinDuration: 2000,
  walkMaxDuration: 5000,
  idleToSleepTimeout: 30000,
  walkSpeed: 40,
  chaseMouseDistance: 80,
  chaseMouseDuration: 3000,
  playfulActionMinDelay: 10000,
  playfulActionMaxDelay: 25000,
  windowWidth: 300,
  windowHeight: 300,
  petWidth: 64,
  petHeight: 64,
};

export class BehaviorController {
  /** 当前行为类型 */
  private currentBehavior: BehaviorType = "idle";
  /** 行为配置 */
  private config: BehaviorConfig;
  /** 各行为实例 */
  private idleBehavior: IdleBehavior;
  private walkBehavior: WalkBehavior;
  private interactBehavior: InteractBehavior;
  /** 事件监听器 */
  private listeners: Map<string, Set<(event: BehaviorEvent) => void>> = new Map();
  /** 宠物当前位置 */
  private position: Vec2 = { x: 0, y: 0 };
  /** 宠物朝向（1 = 右，-1 = 左） */
  private facing: 1 | -1 = 1;
  /** 鼠标全局坐标 */
  private mousePos: MousePosition = { x: 0, y: 0 };
  /** 窗口全局坐标 */
  private windowPos: Vec2 = { x: 0, y: 0 };
  /** 上次自主玩耍行为时间戳 */
  private lastPlayfulActionTime = 0;
  /** 自主玩耍间隔 */
  private playfulActionInterval: number;
  /** 是否暂停（被拖拽时） */
  private paused = false;
  /** 上一次更新的时间戳 */
  private lastUpdateTime = 0;
  /** 是否已启动 */
  private started = false;

  constructor(config?: Partial<BehaviorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 计算初始位置（居中）
    this.position = {
      x: (this.config.windowWidth - this.config.petWidth) / 2,
      y: (this.config.windowHeight - this.config.petHeight) / 2,
    };

    this.idleBehavior = new IdleBehavior(this.config);
    this.walkBehavior = new WalkBehavior(this.config);
    this.interactBehavior = new InteractBehavior();

    // 初始自主玩耍间隔
    this.playfulActionInterval = this.randomBetween(
      this.config.playfulActionMinDelay,
      this.config.playfulActionMaxDelay,
    );
  }

  /**
   * 启动行为系统
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.lastUpdateTime = performance.now();
    this.idleBehavior.enter();
    this.emitEvent("idle");
  }

  /**
   * 停止行为系统
   */
  stop(): void {
    this.started = false;
    this.idleBehavior.exit();
    this.walkBehavior.exit();
    this.interactBehavior.exit();
  }

  /**
   * 每帧更新
   * @param timestamp 当前时间戳（毫秒）
   * @returns 新的宠物位置和朝向
   */
  update(timestamp: number): { position: Vec2; facing: 1 | -1; behavior: BehaviorType } {
    if (!this.started || this.paused) {
      return { position: { ...this.position }, facing: this.facing, behavior: this.currentBehavior };
    }

    const deltaTime = this.lastUpdateTime > 0 ? (timestamp - this.lastUpdateTime) / 1000 : 0;
    this.lastUpdateTime = timestamp;

    // 防止异常大的 delta（例如切标签页后回来）
    const safeDelta = Math.min(deltaTime, 0.1);

    // 更新当前行为
    switch (this.currentBehavior) {
      case "idle":
        this.updateIdle(timestamp);
        break;
      case "walk":
        this.updateWalk(timestamp, safeDelta);
        break;
      case "sleep":
        this.updateSleep(timestamp);
        break;
      case "interact":
        this.updateInteract(timestamp);
        break;
      case "chase_mouse":
        this.updateChaseMouse(timestamp, safeDelta);
        break;
      case "dragged":
        // 被拖拽时不做自主行为
        break;
    }

    // 自主玩耍检测（仅在 idle 或 walk 时）
    if (this.currentBehavior === "idle" || this.currentBehavior === "walk") {
      this.checkPlayfulActions(timestamp);
    }

    return { position: { ...this.position }, facing: this.facing, behavior: this.currentBehavior };
  }

  /**
   * 更新 idle 行为
   */
  private updateIdle(timestamp: number): void {
    const shouldWalk = this.idleBehavior.update(timestamp);
    if (shouldWalk) {
      this.transitionTo("walk");
    }
  }

  /**
   * 更新 walk 行为
   */
  private updateWalk(timestamp: number, delta: number): void {
    const result = this.walkBehavior.update(timestamp, this.position, this.facing, delta);

    // 更新位置
    this.position = result.position;
    this.facing = result.facing;

    // 碰壁处理
    if (result.hitWall) {
      // 短暂攀墙行为后回到 walk
      this.emitEvent("wall_climb");
    }

    // 行走结束，回到 idle
    if (result.finished) {
      this.transitionTo("idle");
    }
  }

  /**
   * 更新 sleep 行为
   */
  private updateSleep(timestamp: number): void {
    // sleep 状态下不做任何移动
    this.idleBehavior.update(timestamp);
  }

  /**
   * 更新 interact 行为
   */
  private updateInteract(timestamp: number): void {
    const finished = this.interactBehavior.update(timestamp);
    if (finished) {
      this.transitionTo("idle");
    }
  }

  /**
   * 更新追鼠标行为
   */
  private updateChaseMouse(timestamp: number, delta: number): void {
    const mouseRelative = this.getMouseRelativePosition();
    const dx = mouseRelative.x - this.position.x - this.config.petWidth / 2;
    const dy = mouseRelative.y - this.position.y - this.config.petHeight / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果鼠标已远离或追了足够时间，停止
    if (distance > this.config.chaseMouseDistance * 2 || this.interactBehavior.isFinished(timestamp)) {
      this.transitionTo("idle");
      return;
    }

    // 朝鼠标方向移动
    const speed = this.config.walkSpeed * 0.6;
    if (distance > 10) {
      const moveX = (dx / distance) * speed * delta;
      const moveY = (dy / distance) * speed * delta;
      this.position.x += moveX;
      this.position.y += moveY;
      this.facing = dx > 0 ? 1 : -1;
    }

    // 边界约束
    this.clampPosition();
  }

  /**
   * 检查自主玩耍行为
   */
  private checkPlayfulActions(timestamp: number): void {
    if (timestamp - this.lastPlayfulActionTime < this.playfulActionInterval) return;

    // 随机选择一个自主行为
    const random = Math.random();

    // 30% 概率追鼠标（如果鼠标在范围内）
    if (random < 0.3) {
      const mouseRelative = this.getMouseRelativePosition();
      const dx = mouseRelative.x - this.position.x;
      const dy = mouseRelative.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.config.chaseMouseDistance * 3) {
        this.transitionTo("chase_mouse");
        this.lastPlayfulActionTime = timestamp;
        this.playfulActionInterval = this.randomBetween(
          this.config.playfulActionMinDelay,
          this.config.playfulActionMaxDelay,
        );
        return;
      }
    }

    // 20% 概率做随机小动作
    if (random < 0.5) {
      const actions: BehaviorType[] = ["stretch", "yawn"];
      const action = actions[Math.floor(Math.random() * actions.length)] ?? "stretch";
      this.emitEvent(action);
      this.lastPlayfulActionTime = timestamp;
      this.playfulActionInterval = this.randomBetween(
        this.config.playfulActionMinDelay,
        this.config.playfulActionMaxDelay,
      );
    }
  }

  /**
   * 切换行为状态
   */
  private transitionTo(target: BehaviorType): void {
    if (this.currentBehavior === target) return;

    // 退出当前行为
    this.exitBehavior(this.currentBehavior);

    this.currentBehavior = target;

    // 进入新行为
    this.enterBehavior(target);
  }

  /**
   * 退出指定行为
   */
  private exitBehavior(behavior: BehaviorType): void {
    switch (behavior) {
      case "idle":
      case "sleep":
        this.idleBehavior.exit();
        break;
      case "walk":
      case "chase_mouse":
        this.walkBehavior.exit();
        break;
      case "interact":
        this.interactBehavior.exit();
        break;
    }
  }

  /**
   * 进入指定行为
   */
  private enterBehavior(behavior: BehaviorType): void {
    switch (behavior) {
      case "idle":
        this.idleBehavior.enter();
        this.emitEvent("idle");
        break;
      case "walk":
        this.walkBehavior.enter(this.position, this.facing);
        this.emitEvent("walk");
        break;
      case "sleep":
        this.idleBehavior.enter();
        this.emitEvent("sleep");
        break;
      case "interact":
        this.interactBehavior.enter();
        this.emitEvent("interact");
        break;
      case "chase_mouse":
        this.walkBehavior.enter(this.position, this.facing);
        this.emitEvent("chase_mouse");
        break;
    }
  }

  /**
   * 处理外部交互（点击、拖拽等）
   */
  handleInteraction(type: "click" | "double_click" | "drag_start" | "drag_end"): void {
    switch (type) {
      case "click":
        this.transitionTo("interact");
        this.emitEvent("interact", { type: "pet" });
        break;
      case "double_click":
        this.emitEvent("interact", { type: "dialog" });
        break;
      case "drag_start":
        this.paused = true;
        this.currentBehavior = "dragged";
        this.emitEvent("dragged");
        break;
      case "drag_end":
        this.paused = false;
        // 掉落效果后回到 idle
        this.emitEvent("fall");
        this.currentBehavior = "idle";
        this.idleBehavior.enter();
        this.emitEvent("idle");
        break;
    }
  }

  /**
   * 更新鼠标位置
   */
  setMousePosition(pos: MousePosition): void {
    this.mousePos = pos;
  }

  /**
   * 更新窗口位置
   */
  setWindowPosition(pos: Vec2): void {
    this.windowPos = pos;
  }

  /**
   * 获取鼠标相对于窗口内宠物画布的位置
   */
  private getMouseRelativePosition(): Vec2 {
    return {
      x: this.mousePos.x - this.windowPos.x,
      y: this.mousePos.y - this.windowPos.y,
    };
  }

  /**
   * 边界约束 — 确保宠物不超出窗口
   */
  private clampPosition(): void {
    this.position.x = Math.max(0, Math.min(this.position.x, this.config.windowWidth - this.config.petWidth));
    this.position.y = Math.max(0, Math.min(this.position.y, this.config.windowHeight - this.config.petHeight));
  }

  /**
   * 获取当前行为类型
   */
  getCurrentBehavior(): BehaviorType {
    return this.currentBehavior;
  }

  /**
   * 获取当前位置
   */
  getPosition(): Vec2 {
    return { ...this.position };
  }

  /**
   * 获取朝向
   */
  getFacing(): 1 | -1 {
    return this.facing;
  }

  /**
   * 注册事件监听
   */
  on(event: string, listener: (event: BehaviorEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * 注销事件监听
   */
  off(event: string, listener: (event: BehaviorEvent) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * 触发事件
   */
  private emitEvent(type: BehaviorType, data?: unknown): void {
    const event: BehaviorEvent = { type, timestamp: performance.now(), data };
    this.listeners.get(type)?.forEach((fn) => fn(event));
    this.listeners.get("*")?.forEach((fn) => fn(event));
  }

  /**
   * 生成随机数
   */
  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * 销毁控制器
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}
