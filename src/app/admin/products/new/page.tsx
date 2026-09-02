import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "新建商品 - Mini Mall" };

export default async function AdminNewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">新建商品</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
