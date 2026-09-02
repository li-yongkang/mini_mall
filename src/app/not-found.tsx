import Link from "next/link";
import { PackageSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 全局中文 404：无效的商品/订单 id（notFound()）与不存在的路由都会走到这里 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <PackageSearchIcon className="size-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">页面不存在</h1>
      <p className="text-muted-foreground">您访问的页面可能已被删除或地址有误</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        返回首页
      </Button>
    </main>
  );
}
