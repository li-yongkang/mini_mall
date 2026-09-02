import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PRODUCTS_PAGE_SIZE } from "@/lib/constants";
import { ProductCard } from "@/components/product/product-card";
import { FilterBar } from "@/components/products/filter-bar";
import { ProductPagination } from "@/components/products/pagination";

export const metadata: Metadata = { title: "全部商品 - Mini Mall" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" && sp.category !== "all" ? sp.category : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "latest";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q) {
    where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
  }
  if (category) where.categoryId = category;

  const orderBy =
    sort === "priceAsc"
      ? { price: "asc" as const }
      : sort === "priceDesc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [categories, products, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort !== "latest") params.set("sort", sort);
    params.set("page", String(target));
    return `/products?${params.toString()}`;
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">全部商品</h1>
      {/* key 随筛选参数变化：URL 变化后重挂载 FilterBar，同步受控表单状态 */}
      <FilterBar
        key={`${q}|${category}|${sort}`}
        q={q}
        category={category}
        sort={sort}
        categories={categories}
      />
      {products.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">没有找到相关商品</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      <div className="mt-8">
        <ProductPagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
      </div>
    </main>
  );
}
