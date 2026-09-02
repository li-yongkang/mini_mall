import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/**
 * 后台布局守卫：proxy 只验签（任何登录用户可过），
 * 这里 requireAdmin 回源 DB 校验 isAdmin，非管理员 redirect("/")。
 * 每个 Server Action 开头还有第三层 requireAdmin 兜底。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">后台管理</h1>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/" />}>
          返回前台
        </Button>
      </div>
      <nav className="mb-6 flex items-center gap-1 border-b pb-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin" />}>
          统计
        </Button>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/products" />}>
          商品管理
        </Button>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/orders" />}>
          订单管理
        </Button>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/categories" />}>
          分类管理
        </Button>
      </nav>
      {children}
    </main>
  );
}
