/**
 * 宠物状态全局存储
 * 供插件系统读取宠物当前状态，由 PetCanvas 驱动更新
 */

import type { PetState } from "@/types";

/** 宠物状态快照 */
export interface PetStateSnapshot {
  state: PetState;
  position: { x: number; y: number };
  facing: "left" | "right";
}

/** 当前宠物状态（全局单例） */
let currentPetState: PetStateSnapshot = {
  state: "idle",
  position: { x: 0, y: 0 },
  facing: "right",
};

/**
 * 更新宠物状态（由 PetCanvas 调用）
 */
export function updatePetState(state: PetStateSnapshot): void {
  currentPetState = state;
}

/**
 * 获取当前宠物状态（由插件系统调用）
 */
export function getPetState(): PetStateSnapshot {
  return currentPetState;
}
