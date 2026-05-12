/**
 * 宠物控制 API (dango.pet)
 * 提供动画播放、移动、对话、表情和状态查询能力
 */

import type { PermissionChecker } from "../permissions";
import type { PetState } from "@/types";

/** 宠物状态信息 */
export interface PetStateInfo {
  state: PetState;
  position: { x: number; y: number };
  facing: "left" | "right";
}

/** 宠物控制 API 接口 */
export interface PetAPI {
  playAnimation(name: string): Promise<void>;
  moveTo(x: number, y: number): Promise<void>;
  say(text: string, duration?: number): void;
  emote(type: string): void;
  getState(): PetStateInfo;
  getPosition(): { x: number; y: number };
}

/** 宠物控制宿主接口 — 由 React 组件提供实际实现 */
export interface PetHost {
  playAnimation(name: string): Promise<void>;
  moveTo(x: number, y: number): Promise<void>;
  say(text: string, duration?: number): void;
  emote(type: string): void;
  getState(): PetStateInfo;
  getPosition(): { x: number; y: number };
}

/**
 * 创建宠物控制 API 实例
 * 每次调用都会检查权限
 */
export function createPetAPI(
  _pluginId: string,
  permissions: PermissionChecker,
  host: PetHost,
): PetAPI {
  return {
    async playAnimation(name: string): Promise<void> {
      permissions.assertApiAccess("pet");
      return host.playAnimation(name);
    },

    async moveTo(x: number, y: number): Promise<void> {
      permissions.assertApiAccess("pet");
      return host.moveTo(x, y);
    },

    say(text: string, duration?: number): void {
      permissions.assertApiAccess("pet");
      host.say(text, duration);
    },

    emote(type: string): void {
      permissions.assertApiAccess("pet");
      host.emote(type);
    },

    getState(): PetStateInfo {
      permissions.assertApiAccess("pet");
      return host.getState();
    },

    getPosition(): { x: number; y: number } {
      permissions.assertApiAccess("pet");
      return host.getPosition();
    },
  };
}
