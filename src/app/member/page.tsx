import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMemberInfo, MEMBER_LEVELS } from "@/lib/member";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemberCard } from "@/components/member/member-card";

export const metadata: Metadata = { title: "会员中心 - Mini Mall" };

export default async function MemberPage() {
  const user = await requireUser();
  const member = getMemberInfo(user.totalSpent);

  const allLevels = [
    { level: 0, name: "普通会员", minSpent: 0, discountPercent: 100 },
    ...MEMBER_LEVELS,
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">会员中心</h1>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <MemberCard member={member} totalSpent={user.totalSpent} />

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">心悦等级</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {allLevels.map((level) => {
                const active = level.level === member.level;
                return (
                  <Card
                    key={level.level}
                    className={
                      active
                        ? "ring-2 ring-primary"
                        : level.level === member.nextLevel?.level
                          ? "ring-1 ring-foreground/15"
                          : undefined
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {level.level === 0 ? "普通会员" : `${level.name}`}
                        </CardTitle>
                        {active && <Badge>当前等级</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>
                        累计消费{" "}
                        {level.minSpent === 0 ? "注册即享" : `满 ${formatPrice(level.minSpent)}`}
                      </p>
                      <p>
                        下单折扣：{level.discountPercent < 100 ? `${level.discountPercent} 折` : "无"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            <h2 className="mb-2 text-base font-semibold text-foreground">规则说明</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>等级按累计消费实时计算，仅统计已支付订单（取消订单不计）。</li>
              <li>下单时按当前等级计价：本单支付后跨越升级门槛，新折扣自下一单起生效。</li>
              <li>折扣作用于整单，实付金额四舍五入到分。</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
