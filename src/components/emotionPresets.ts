/**
 * 表情预设常量
 */

/** 预设表情 */
export const EMOTIONS = {
  // 交互表情
  pet: ["(^///^)", "(=^.^=)", "(*^v^*)", "(^o^)"],
  like: ["(♥ω♥)", "(*╯3╰)", "(づ￣ 3￣)づ"],
  happy: ["٩(◕‿◕)۶", "(ﾉ◕ヮ◕)ﾉ*: ・゚✧", "✧˖°"],
  sleepy: ["(－ω－) zzZ", "(-.-)zzZ", "(∪｡∪)｡｡｡"],
  surprised: ["Σ( ° △ °|||)", "(°ロ°) !", "!!!"],
  stretch: ["( stretching... )", "~(^o^)~"],
  yawn: ["~(=^‥^)~", "( yawning... )"],
} as const;

/**
 * 从预设中随机选取一个表情
 */
export function randomEmotion(category: keyof typeof EMOTIONS): string {
  const pool = EMOTIONS[category];
  return pool[Math.floor(Math.random() * pool.length)] ?? "(=^.^=)";
}
