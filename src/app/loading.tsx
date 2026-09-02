import { Skeleton } from "@/components/ui/skeleton";

/** 根级加载骨架：路由切换时替换 page 内容（layout 与 Header 保持渲染） */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
