import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatPrice } from "@/lib/format";
import { MEMBER_LEVELS, type MemberInfo } from "@/lib/member";

type MemberCardProps = {
  member: MemberInfo;
  totalSpent: number; // 分
};

/** 会员卡片（服务端渲染）：当前等级 / 下单折扣 / 累计消费 / 距下一级进度 */
export function MemberCard({ member, totalSpent }: MemberCardProps) {
  // 进度条区间：当前等级起点 ~ 下一等级阈值
  const currentMin = member.level === 0 ? 0 : MEMBER_LEVELS[member.level - 1].minSpent;
  const percent = member.nextLevel
    ? Math.min(
        100,
        Math.round(((totalSpent - currentMin) / (member.nextLevel.minSpent - currentMin)) * 100)
      )
    : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>我的会员</CardTitle>
          <Badge variant={member.level > 0 ? "default" : "secondary"} className="text-sm">
            {member.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">下单折扣</span>
          <span className="text-xl font-bold text-primary">
            {member.discountPercent < 100 ? `${member.discountPercent} 折` : "无折扣"}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">累计消费（已支付订单）</span>
          <span className="font-medium">{formatPrice(totalSpent)}</span>
        </div>
        {member.nextLevel ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">
                距{member.nextLevel.name}（{member.nextLevel.discountPercent} 折）还差
              </span>
              <span className="font-medium text-primary">
                {formatPrice(member.nextLevel.remaining)}
              </span>
            </div>
            <Progress value={percent} />
            <p className="text-xs text-muted-foreground">
              累计消费满 {formatPrice(member.nextLevel.minSpent)} 自动升级
            </p>
          </div>
        ) : (
          <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
            已是最高等级，尊享 {member.discountPercent} 折
          </p>
        )}
      </CardContent>
    </Card>
  );
}
