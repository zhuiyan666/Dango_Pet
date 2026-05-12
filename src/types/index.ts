/**
 * 帧动画定义
 * 描述一组动画帧的播放参数
 */
export interface AnimationClip {
  /** 动画名称（如 "idle", "walk", "sleep"） */
  name: string;
  /** 精灵图资源路径 */
  spriteSrc: string;
  /** 帧宽度（像素） */
  frameWidth: number;
  /** 帧高度（像素） */
  frameHeight: number;
  /** 总帧数 */
  frameCount: number;
  /** 帧率（FPS） */
  fps: number;
  /** 是否循环播放 */
  loop: boolean;
}

/**
 * 精灵图渲染器配置
 */
export interface SpriteRendererConfig {
  /** Canvas 元素 */
  canvas: HTMLCanvasElement;
  /** 宠物在窗口中的 X 坐标 */
  x: number;
  /** 宠物在窗口中的 Y 坐标 */
  y: number;
  /** 缩放比例 */
  scale: number;
}

/**
 * 宠物行为状态
 */
export type PetState = "idle" | "walk" | "sleep" | "interact";

/**
 * 行为状态枚举（扩展 PetState，增加细粒度行为）
 */
export type BehaviorType =
  | "idle"           // 待机
  | "walk"           // 行走
  | "sleep"          // 睡觉
  | "interact"       // 用户交互
  | "chase_mouse"    // 追鼠标
  | "stretch"        // 伸懒腰
  | "yawn"           // 打哈欠
  | "dragged"        // 被拖拽
  | "fall"           // 掉落
  | "wall_climb";    // 攀墙

/**
 * 二维向量
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 行为配置
 */
export interface BehaviorConfig {
  /** idle → walk 切换的最小间隔（毫秒） */
  idleToWalkMinDelay: number;
  /** idle → walk 切换的最大间隔（毫秒） */
  idleToWalkMaxDelay: number;
  /** walk → idle 行走持续最小时间（毫秒） */
  walkMinDuration: number;
  /** walk → idle 行走持续最大时间（毫秒） */
  walkMaxDuration: number;
  /** idle → sleep 空闲超时（毫秒） */
  idleToSleepTimeout: number;
  /** 行走速度（像素/秒） */
  walkSpeed: number;
  /** 追鼠标触发距离（像素） */
  chaseMouseDistance: number;
  /** 追鼠标持续时间（毫秒） */
  chaseMouseDuration: number;
  /** 自主玩耍最小间隔（毫秒） */
  playfulActionMinDelay: number;
  /** 自主玩耍最大间隔（毫秒） */
  playfulActionMaxDelay: number;
  /** 窗口宽度 */
  windowWidth: number;
  /** 窗口高度 */
  windowHeight: number;
  /** 宠物宽度 */
  petWidth: number;
  /** 宠物高度 */
  petHeight: number;
}

/**
 * 行为事件
 */
export interface BehaviorEvent {
  type: BehaviorType;
  timestamp: number;
  data?: unknown;
}

/**
 * 右键菜单项
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
}

/**
 * 表情气泡配置
 */
export interface EmotionBubbleConfig {
  /** 表情文本或符号 */
  emotion: string;
  /** 持续时间（毫秒） */
  duration: number;
  /** 位置偏移 */
  offset?: Vec2;
}

/**
 * 鼠标位置信息
 */
export interface MousePosition {
  x: number;
  y: number;
}
