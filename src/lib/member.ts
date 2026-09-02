// 心悦会员体系：等级由累计消费（分）实时推导，不落库
export type MemberLevel = {
  level: number;
  name: string;
  minSpent: number; // 升级所需累计消费（分）
  discountPercent: number; // 下单折扣
};

export const MEMBER_LEVELS: readonly MemberLevel[] = [
  { level: 1, name: "心悦1级", minSpent: 800_000, discountPercent: 98 }, // ¥8,000
  { level: 2, name: "心悦2级", minSpent: 8_000_000, discountPercent: 95 }, // ¥80,000
  { level: 3, name: "心悦3级", minSpent: 80_000_000, discountPercent: 90 }, // ¥800,000
];

export type MemberInfo = {
  level: number; // 0=普通会员
  name: string;
  discountPercent: number; // 100=无折扣
  /** 下一级目标与差额（null=已是最高等级） */
  nextLevel: {
    level: number;
    name: string;
    minSpent: number;
    remaining: number; // 距升级还差的消费额（分）
    discountPercent: number;
  } | null;
};

/**
 * 由累计消费推导当前等级。"后续享受"语义：下单时按当前 totalSpent 计价，
 * 本单支付后跨过阈值，下一单起才享受新折扣。
 */
export function getMemberInfo(totalSpent: number): MemberInfo {
  let level = 0;
  let discountPercent = 100;
  for (const l of MEMBER_LEVELS) {
    if (totalSpent >= l.minSpent) {
      level = l.level;
      discountPercent = l.discountPercent;
    }
  }
  const nextLevel = MEMBER_LEVELS.find((l) => l.level === level + 1) ?? null;
  return {
    level,
    name: level === 0 ? "普通会员" : MEMBER_LEVELS[level - 1].name,
    discountPercent,
    nextLevel: nextLevel
      ? { ...nextLevel, remaining: nextLevel.minSpent - totalSpent }
      : null,
  };
}

/** 订单快照里的等级数字 → 展示名（历史订单不随等级调整变化） */
export function getLevelName(level: number): string {
  if (level === 0) return "普通会员";
  return MEMBER_LEVELS.find((l) => l.level === level)?.name ?? "普通会员";
}
