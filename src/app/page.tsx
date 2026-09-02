import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";

export default async function Home() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <section className="mb-10">
        <h1 className="text-3xl font-bold">Mini Mall</h1>
        <p className="mt-2 text-muted-foreground">微型电商演示 —— 精选好物，即刻下单</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">商品分类</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="rounded-xl border bg-card p-4 text-center font-medium transition-colors hover:bg-muted"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新上架</h2>
          <Link href="/products" className="text-sm text-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
