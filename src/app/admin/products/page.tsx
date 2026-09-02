import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const metadata: Metadata = { title: "商品管理 - Mini Mall" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <form method="get" action="/admin/products" className="flex w-full max-w-sm gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索商品名称…"
            className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" variant="outline" size="sm">
            搜索
          </Button>
        </form>
        <Button size="sm" nativeButton={false} render={<Link href="/admin/products/new" />}>
          新建商品
        </Button>
      </div>
      {products.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无商品</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="max-w-52">
                    <Link
                      href={`/products/${product.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell className="tabular-nums">{formatPrice(product.price)}</TableCell>
                  <TableCell className="tabular-nums">{product.stock}</TableCell>
                  <TableCell>
                    {product.isActive ? (
                      <Badge variant="secondary">上架</Badge>
                    ) : (
                      <Badge variant="destructive">下架</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(product.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/admin/products/${product.id}/edit`} />}
                      >
                        编辑
                      </Button>
                      <ProductRowActions
                        productId={product.id}
                        productName={product.name}
                        isActive={product.isActive}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
