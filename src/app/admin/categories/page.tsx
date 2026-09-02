import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "分类管理 - Mini Mall" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">分类管理</h2>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
