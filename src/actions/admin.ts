"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type AdminFormState = { error?: string } | undefined;
export type AdminActionState = { error?: string; ok?: boolean } | undefined;

/** 商品表单：价格以"元"字符串提交，服务端转"分"入库（Math.round 消除浮点误差） */
const productSchema = z.object({
  name: z.string().trim().min(1, "请输入商品名称").max(50, "名称不超过 50 字"),
  description: z.string().trim().max(500, "描述不超过 500 字"),
  price: z
    .string()
    .trim()
    .min(1, "请输入价格")
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 0.01 && Number(v) <= 999_999,
      "价格需在 0.01 ~ 999999 元之间"
    ),
  stock: z.coerce
    .number()
    .int("库存必须是整数")
    .min(0, "库存不能为负")
    .max(999_999, "库存过大"),
  categoryId: z.string().min(1, "请选择分类"),
  imageUrl: z.string().min(1, "请选择图片"),
});

const productIdSchema = z.object({ id: z.string().min(1) });

export async function createProduct(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "参数错误" };
  const { name, description, price, stock, categoryId, imageUrl } = parsed.data;
  await prisma.product.create({
    data: {
      name,
      description,
      price: Math.round(Number(price) * 100), // 元 → 分
      stock,
      categoryId,
      imageUrl,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const idParsed = productIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) return { error: "参数错误" };
  const { id } = idParsed.data;
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "参数错误" };
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "商品不存在" };
  const { name, description, price, stock, categoryId, imageUrl } = parsed.data;
  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price: Math.round(Number(price) * 100),
      stock,
      categoryId,
      imageUrl,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

/** 删除商品：OrderItem.product 为 SetNull，历史订单不受影响 */
export async function deleteProduct(productId: string): Promise<AdminActionState> {
  await requireAdmin();
  const { count } = await prisma.product.deleteMany({ where: { id: productId } });
  if (count === 0) return { error: "商品不存在" };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

/** 上下架切换 */
export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<AdminActionState> {
  await requireAdmin();
  const { count } = await prisma.product.updateMany({
    where: { id: productId },
    data: { isActive },
  });
  if (count === 0) return { error: "商品不存在" };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

/** 发货：仅 PAID 订单（updateMany 乐观锁） */
export async function shipOrder(orderId: string): Promise<AdminActionState> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "订单不存在" };
  if (order.status !== "PAID") return { error: "仅已支付订单可发货" };
  await prisma.order.updateMany({
    where: { id: orderId, status: "PAID" },
    data: { status: "SHIPPED" },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "请输入分类名称").max(20, "名称不超过 20 字"),
});

export async function createCategory(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "参数错误" };
  try {
    await prisma.category.create({ data: { name: parsed.data.name } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { error: "分类已存在" };
    throw e;
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

/** 删除分类：先查关联商品，有关联则拒绝 */
export async function deleteCategory(categoryId: string): Promise<AdminActionState> {
  await requireAdmin();
  const count = await prisma.product.count({ where: { categoryId } });
  if (count > 0) {
    return { error: `该分类下有 ${count} 件商品，请先移除或转移商品` };
  }
  const { count: deleted } = await prisma.category.deleteMany({ where: { id: categoryId } });
  if (deleted === 0) return { error: "分类不存在" };
  revalidatePath("/admin/categories");
  return { ok: true };
}
