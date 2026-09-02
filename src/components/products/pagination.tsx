import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProductPaginationProps = {
  currentPage: number;
  totalPages: number;
  /** 生成目标页的完整 URL（保留当前筛选参数） */
  buildHref: (page: number) => string;
};

/** 商品列表分页（服务端组件）：Link 保留现有 query 参数 */
export function ProductPagination({ currentPage, totalPages, buildHref }: ProductPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="分页" className="flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Button
          variant="outline"
          size="icon"
          nativeButton={false}
          render={<Link href={buildHref(currentPage - 1)} aria-label="上一页" />}
        >
          <ChevronLeftIcon />
        </Button>
      )}
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="icon"
          nativeButton={false}
          render={
            <Link
              href={buildHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
            />
          }
        >
          {page}
        </Button>
      ))}
      {currentPage < totalPages && (
        <Button
          variant="outline"
          size="icon"
          nativeButton={false}
          render={<Link href={buildHref(currentPage + 1)} aria-label="下一页" />}
        >
          <ChevronRightIcon />
        </Button>
      )}
    </nav>
  );
}
