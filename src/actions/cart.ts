"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const addToCartSchema = z.object({
  productId: z.string().min(1, "商品参数错误"),
  quantity: z.coerce
    .number()
    .int("数量必须是整数")
    .min(1, "数量至少为 1")
    .max(99, "单次最多加购 99 件"),
});

export type AddToCartState = { error?: string; ok?: boolean } | undefined;

/** 加购：重复加购累加数量，上限为库存；未登录由 requireUser 拦到登录页 */
export async function addToCart(
  _prevState: AddToCartState,
  formData: FormData
): Promise<AddToCartState> {
  const user = await requireUser();
  const parsed = addToCartSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "参数错误" };
  }

  const { productId, quantity } = parsed.data;
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });
  if (!product) return { error: "商品不存在或已下架" };
  if (product.stock <= 0) return { error: "商品已售罄" };

  // 事务内读当前数量并 clamp 到库存上限，避免并发下超量
  const full = await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing && existing.quantity >= product.stock) return true;
    const target = Math.min((existing?.quantity ?? 0) + quantity, product.stock);
    if (existing) {
      await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: target } });
    } else {
      await tx.cartItem.create({
        data: { userId: user.id, productId, quantity: target },
      });
    }
    return false;
  });
  if (full) return { error: "已达该商品库存上限" };

  revalidatePath("/cart");
  return { ok: true };
}
