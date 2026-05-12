/**
 * 模型配置管理
 * 负责配置的持久化存储和多配置管理
 */

/** 模型提供者类型 */
export type ModelProviderType = "openai" | "claude" | "openai-compatible";

/** 单个模型配置 */
export interface ModelConfig {
  /** 配置唯一标识 */
  id: string;
  /** 配置名称（用户自定义） */
  name: string;
  /** 提供者类型 */
  provider: ModelProviderType;
  /** API 密钥 */
  apiKey: string;
  /** API 基础地址（可选，用于自定义代理或 Ollama） */
  baseUrl?: string;
  /** 模型标识 */
  model: string;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 温度参数 */
  temperature?: number;
  /** 是否为当前激活配置 */
  active?: boolean;
}

/** 配置管理器存储格式 */
interface StoredConfig {
  configs: ModelConfig[];
  activeId: string | null;
}

const STORAGE_KEY = "dango_model_configs";

/** 生成唯一 ID */
function generateId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 模型配置管理器
 * 支持多组配置的增删改查和持久化
 */
export class ModelConfigManager {
  private configs: ModelConfig[] = [];
  private activeId: string | null = null;

  constructor() {
    this.load();
  }

  /** 从本地存储加载配置 */
  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: StoredConfig = JSON.parse(raw);
        this.configs = data.configs ?? [];
        this.activeId = data.activeId ?? null;
      }
    } catch {
      this.configs = [];
      this.activeId = null;
    }
  }

  /** 保存配置到本地存储 */
  private save(): void {
    const data: StoredConfig = {
      configs: this.configs,
      activeId: this.activeId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** 获取所有配置 */
  getAll(): ModelConfig[] {
    return [...this.configs];
  }

  /** 获取当前激活的配置 */
  getActive(): ModelConfig | null {
    if (!this.activeId) return null;
    return this.configs.find((c) => c.id === this.activeId) ?? null;
  }

  /** 根据 ID 获取配置 */
  getById(id: string): ModelConfig | null {
    return this.configs.find((c) => c.id === id) ?? null;
  }

  /** 添加新配置 */
  add(
    config: Omit<ModelConfig, "id" | "active">,
  ): ModelConfig {
    const newConfig: ModelConfig = {
      ...config,
      id: generateId(),
      active: false,
    };
    this.configs.push(newConfig);

    // 如果是第一个配置，自动设为激活
    if (this.configs.length === 1) {
      this.activeId = newConfig.id;
      newConfig.active = true;
    }

    this.save();
    return newConfig;
  }

  /** 更新已有配置 */
  update(id: string, updates: Partial<Omit<ModelConfig, "id">>): boolean {
    const existing = this.configs.find((c) => c.id === id);
    if (!existing) return false;

    Object.assign(existing, updates);
    this.save();
    return true;
  }

  /** 删除配置 */
  remove(id: string): boolean {
    const index = this.configs.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.configs.splice(index, 1);

    // 如果删除的是激活配置，切换到第一个
    if (this.activeId === id) {
      const first = this.configs[0];
      this.activeId = first ? first.id : null;
      if (first) {
        first.active = true;
      }
    }

    this.save();
    return true;
  }

  /** 设置激活配置 */
  setActive(id: string): boolean {
    const config = this.configs.find((c) => c.id === id);
    if (!config) return false;

    // 取消旧的激活状态
    this.configs.forEach((c) => (c.active = false));

    // 设置新的激活状态
    config.active = true;
    this.activeId = id;

    this.save();
    return true;
  }

  /** 检查是否有可用配置 */
  hasActiveConfig(): boolean {
    return this.getActive() !== null;
  }
}
