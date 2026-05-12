/**
 * 交互行为
 * 处理用户交互（点击、拖拽等）触发的行为
 */

/** 交互动画持续时间 */
const INTERACT_DURATION = 1500;

export class InteractBehavior {
  /** 进入交互的时间 */
  private enterTime = 0;
  /** 是否已进入行为 */
  private active = false;
  /** 交互持续时间 */
  private duration = INTERACT_DURATION;

  constructor() {
    // 初始化
  }

  /**
   * 进入交互行为
   */
  enter(): void {
    this.active = true;
    this.enterTime = performance.now();
    this.duration = INTERACT_DURATION;
  }

  /**
   * 退出交互行为
   */
  exit(): void {
    this.active = false;
  }

  /**
   * 每帧更新
   * @returns 交互是否已完成
   */
  update(timestamp: number): boolean {
    if (!this.active) return true;

    return timestamp - this.enterTime > this.duration;
  }

  /**
   * 检查交互是否已超时完成
   */
  isFinished(timestamp: number): boolean {
    return timestamp - this.enterTime > this.duration;
  }
}
