import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AddToCartButton } from "@/components/product/add-to-cart-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    select: { name: true },
  });
  return { title: product ? `${product.name} - Mini Mall` : "商品不存在 - Mini Mall" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    include: { category: true },
  });
  if (!product) notFound();

  const soldOut = product.stock <= 0;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="secondary" render={<Link href={`/products?category=${product.categoryId}`} />}>
              {product.category.name}
            </Badge>
            <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
          </div>
          <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
          <p className="text-muted-foreground">{product.description}</p>
          <Separator />
          <p className="text-sm text-muted-foreground">
            库存：{product.stock} 件
            {soldOut && <span className="ml-2 font-medium text-destructive">（已售罄）</span>}
          </p>
          <AddToCartButton productId={product.id} stock={product.stock} disabled={soldOut} />
        </div>
      </div>
    </main>
  );
}
