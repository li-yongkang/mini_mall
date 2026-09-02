import Link from "next/link";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getMemberInfo } from "@/lib/member";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function Header() {
  const user = await getCurrentUser();
  const member = user ? getMemberInfo(user.totalSpent) : null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-bold">
            Mini Mall
          </Link>
          <nav className="ml-6 hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
              首页
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/products" />}>
              商品
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/cart" />}>
              购物车
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/orders" />}>
              我的订单
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/member" />}>
              会员中心
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.name}</span>
              {member && (
                <Badge
                  variant={member.level > 0 ? "default" : "secondary"}
                  render={<Link href="/member" aria-label="会员中心" />}
                >
                  {member.name}
                </Badge>
              )}
              {user.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/admin" />}
                >
                  后台管理
                </Button>
              )}
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  登出
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
                登录
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                注册
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
