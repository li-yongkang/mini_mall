"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMemberInfo } from "@/lib/member";

const placeOrderSchema = z.object({
  cartItemIds: z.array(z.string().min(1)).min(1, "请选择要结算的商品"),
});

export type PlaceOrderState = { error?: string } | undefined;
export type OrderActionState = { error?: string; ok?: boolean } | undefined;

/** 事务内的业务错误（区别于 NEXT_REDIRECT 等框架异常，需原样外抛） */
class OrderError extends Error {}

/** 订单号：MM + 毫秒时间戳 + 4 位随机 */
function generateOrderNo(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${mm}${Date.now()}${rand}`;
}

/**
 * 下单（交互式事务）：
 * 1. 属主查询购物车项（where 带 userId，天然防越权）
 * 2. 逐个校验上架与库存，任一不足抛 OrderError → 全量回滚，购物车保留
 * 3. 按事务内读到的 totalSpent 推导等级与折扣，实付 = round(原价合计 × 折扣 / 100)
 * 4. 建订单 + OrderItem 快照（price 存原价）
 * 5. 原子扣库存 → 6. 删除已下单购物车项
 * 成功后 redirect 订单详情（redirect 在 try 外，避免 NEXT_REDIRECT 被吞）
 */
export async function placeOrder(
  _prevState: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const user = await requireUser();
  const parsed = placeOrderSchema.safeParse({ cartItemIds: formData.getAll("cartItemId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "参数错误" };
  }

  let orderId: string | null = null;
  let error: string | null = null;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      const items = await tx.cartItem.findMany({
        where: { id: { in: parsed.data.cartItemIds }, userId: user.id },
        include: { product: true },
      });
      if (items.length === 0) throw new OrderError("请选择要结算的商品");

      for (const item of items) {
        if (!item.product.isActive) {
          throw new OrderError(`"${item.product.name}"已下架，请先移除`);
        }
        if (item.product.stock < item.quantity) {
          throw new OrderError(`"${item.product.name}"库存不足（剩余 ${item.product.stock} 件）`);
        }
      }

      const current = await tx.user.findUnique({
        where: { id: user.id },
        select: { totalSpent: true },
      });
      const member = getMemberInfo(current?.totalSpent ?? 0);
      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalAmount = Math.round((subtotal * member.discountPercent) / 100);

      const order = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId: user.id,
          totalAmount,
          discountPercent: member.discountPercent,
          memberLevel: member.level,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price, // 快照存原价
              imageUrl: item.product.imageUrl,
              quantity: item.quantity,
            })),
          },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
      return order.id;
    });
  } catch (e) {
    if (e instanceof OrderError) error = e.message;
    else throw e;
  }
  if (error) return { error };

  revalidatePath("/cart");
  revalidatePath("/orders");
  redirect(`/orders/${orderId}`);
}

/**
 * 模拟支付：订单置 PAID + paidAt，totalSpent 同事务累加（"后续享受"——下一单起生效）。
 * updateMany 乐观锁：并发支付只有一个成功。
 */
export async function payOrder(orderId: string): Promise<OrderActionState> {
  const user = await requireUser();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
  });
  if (!order) return { error: "订单不存在" };
  if (order.status !== "PENDING") return { error: "当前状态不可支付" };

  let error: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (result.count === 0) throw new OrderError("订单状态已变更，请刷新后重试");
      await tx.user.update({
        where: { id: user.id },
        data: { totalSpent: { increment: order.totalAmount } },
      });
    });
  } catch (e) {
    if (e instanceof OrderError) error = e.message;
    else throw e;
  }
  if (error) return { error };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/member");
  return { ok: true };
}

/** 取消订单：置 CANCELLED + 回补库存；totalSpent 不动（未支付不计累计消费） */
export async function cancelOrder(orderId: string): Promise<OrderActionState> {
  const user = await requireUser();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: true },
  });
  if (!order) return { error: "订单不存在" };
  if (order.status !== "PENDING") return { error: "当前状态不可取消" };

  await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (result.count === 0) return;
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}
