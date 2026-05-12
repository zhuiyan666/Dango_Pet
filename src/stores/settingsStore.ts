/**
 * 应用设置存储
 * 管理外观、行为等全局设置的持久化
 */

/** 外观设置 */
export interface AppearanceSettings {
  /** 宠物缩放比例 (0.5 ~ 3) */
  petScale: number;
  /** 宠物透明度 (0.1 ~ 1) */
  petOpacity: number;
  /** 开机自启 */
  autostart: boolean;
}

/** 行为设置 */
export interface BehaviorSettings {
  /** 行走速度 (像素/秒) */
  walkSpeed: number;
  /** 自主行为频率：active / normal / quiet */
  activityLevel: "active" | "normal" | "quiet";
  /** 是否允许追鼠标 */
  allowChaseMouse: boolean;
}

/** 完整设置 */
export interface AppSettings {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  /** 是否已完成首次引导 */
  hasCompletedWelcome: boolean;
}

/** 默认设置 */
const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    petScale: 2,
    petOpacity: 1,
    autostart: false,
  },
  behavior: {
    walkSpeed: 40,
    activityLevel: "normal",
    allowChaseMouse: true,
  },
  hasCompletedWelcome: false,
};

const STORAGE_KEY = "dango_app_settings";

/**
 * 从本地存储加载设置
 */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppSettings>;
      return {
        appearance: { ...DEFAULT_SETTINGS.appearance, ...saved.appearance },
        behavior: { ...DEFAULT_SETTINGS.behavior, ...saved.behavior },
        hasCompletedWelcome: saved.hasCompletedWelcome ?? false,
      };
    }
  } catch {
    // 解析失败使用默认值
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 保存设置到本地存储
 */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * 获取活动频率对应的行为配置参数
 */
export function getActivityDelays(level: BehaviorSettings["activityLevel"]): {
  playfulActionMinDelay: number;
  playfulActionMaxDelay: number;
  idleToWalkMinDelay: number;
  idleToWalkMaxDelay: number;
} {
  switch (level) {
    case "active":
      return {
        playfulActionMinDelay: 5000,
        playfulActionMaxDelay: 12000,
        idleToWalkMinDelay: 2000,
        idleToWalkMaxDelay: 5000,
      };
    case "quiet":
      return {
        playfulActionMinDelay: 20000,
        playfulActionMaxDelay: 45000,
        idleToWalkMinDelay: 6000,
        idleToWalkMaxDelay: 15000,
      };
    case "normal":
    default:
      return {
        playfulActionMinDelay: 10000,
        playfulActionMaxDelay: 25000,
        idleToWalkMinDelay: 3000,
        idleToWalkMaxDelay: 8000,
      };
  }
}
