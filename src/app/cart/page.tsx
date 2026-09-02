import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMemberInfo } from "@/lib/member";
import { Button } from "@/components/ui/button";
import { CartItemsClient } from "@/components/cart/cart-items-client";

export const metadata: Metadata = { title: "购物车 - Mini Mall" };

export default async function CartPage() {
  const user = await requireUser();
  const [items, current] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { totalSpent: true } }),
  ]);
  const member = getMemberInfo(current?.totalSpent ?? 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">购物车</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border py-20 text-muted-foreground">
          <ShoppingCartIcon className="size-12" />
          <p>购物车还是空的</p>
          <Button nativeButton={false} render={<Link href="/products" />}>
            去逛逛
          </Button>
        </div>
      ) : (
        <CartItemsClient
          items={items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            imageUrl: item.product.imageUrl,
            stock: item.product.stock,
            isActive: item.product.isActive,
            quantity: item.quantity,
          }))}
          member={{ name: member.name, discountPercent: member.discountPercent }}
        />
      )}
    </main>
  );
}
