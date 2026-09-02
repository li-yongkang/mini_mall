"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/format";
import { removeFromCart, updateCartItemQuantity } from "@/actions/cart";
import { placeOrder, type PlaceOrderState } from "@/actions/order";

type CartItemData = {
  id: string;
  productId: string;
  name: string;
  price: number; // 分
  imageUrl: string;
  stock: number;
  isActive: boolean;
  quantity: number;
};

type CartItemsClientProps = {
  items: CartItemData[];
  member: { name: string; discountPercent: number };
};

/** 购物车交互区：勾选 / 数量 / 删除 / 合计 / 会员折扣预估 / 提交订单 */
export function CartItemsClient({ items, member }: CartItemsClientProps) {
  // 本地行数据为主控（数量/删除后乐观更新；服务端 action 返回实际值校正）
  const [rows, setRows] = useState(items);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.isActive && i.stock > 0).map((i) => i.id))
  );
  const [deleteTarget, setDeleteTarget] = useState<CartItemData | null>(null);
  const [mutating, startMutating] = useTransition();
  const [placeState, placeAction, placing] = useActionState<PlaceOrderState, FormData>(
    placeOrder,
    undefined
  );
  const prevPlaceState = useRef(placeState);

  useEffect(() => {
    if (placeState === prevPlaceState.current) return;
    prevPlaceState.current = placeState;
    if (placeState?.error) toast.error(placeState.error);
  }, [placeState]);

  const selectedRows = rows.filter((r) => selected.has(r.id));
  const subtotal = selectedRows.reduce((sum, r) => sum + r.price * r.quantity, 0);
  const payable = Math.round((subtotal * member.discountPercent) / 100);
  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleItem = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const changeQuantity = (item: CartItemData, delta: number) => {
    const qty = Math.max(1, item.quantity + delta);
    if (qty === item.quantity) return;
    setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, quantity: qty } : r)));
    startMutating(async () => {
      const result = await updateCartItemQuantity(item.id, qty);
      if (result?.error) toast.error(result.error);
      else if (result?.quantity !== undefined) {
        // 服务端 clamp（如库存上限）后的实际值校正本地
        setRows((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, quantity: result.quantity! } : r))
        );
      }
    });
  };

  const confirmDelete = () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    setRows((prev) => prev.filter((r) => r.id !== target.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(target.id);
      return next;
    });
    startMutating(async () => {
      const result = await removeFromCart(target.id);
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 rounded-xl border">
        <div className="flex items-center gap-3 border-b p-4">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="全选" />
          <span className="text-sm text-muted-foreground">
            全选（已选 {selected.size} / {rows.length}）
          </span>
        </div>
        {rows.map((item) => {
          const available = item.isActive && item.stock > 0;
          return (
            <div key={item.id} className="flex items-center gap-3 border-b p-4 last:border-b-0">
              <Checkbox
                checked={selected.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
                disabled={!available}
                aria-label={`选择 ${item.name}`}
              />
              <Link href={`/products/${item.productId}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.productId}`} className="truncate font-medium hover:underline">
                  {item.name}
                </Link>
                {!item.isActive && <p className="text-xs text-destructive">已下架</p>}
                <p className="text-sm text-primary">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center rounded-lg border border-input">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!available || item.quantity <= 1}
                  onClick={() => changeQuantity(item, -1)}
                  aria-label={`减少 ${item.name} 数量`}
                >
                  <MinusIcon />
                </Button>
                <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!available || item.quantity >= item.stock}
                  onClick={() => changeQuantity(item, 1)}
                  aria-label={`增加 ${item.name} 数量`}
                >
                  <PlusIcon />
                </Button>
              </div>
              <span className="w-24 text-right text-sm font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={() => setDeleteTarget(item)}
                aria-label={`移除 ${item.name}`}
              >
                <Trash2Icon />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="w-full shrink-0 rounded-xl border p-4 lg:w-72">
        <div className="mb-3 text-sm text-muted-foreground">
          {member.discountPercent < 100 ? (
            <>
              <span className="font-medium text-primary">{member.name}</span> · 本单{" "}
              {member.discountPercent} 折
            </>
          ) : (
            <span>{member.name} · 暂无折扣</span>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">商品总额</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {member.discountPercent < 100 && (
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">会员折扣</span>
            <span className="text-primary">-{formatPrice(subtotal - payable)}</span>
          </div>
        )}
        <div className="mt-3 flex items-baseline justify-between border-t pt-3">
          <span>预估实付</span>
          <span className="text-xl font-bold text-primary">{formatPrice(payable)}</span>
        </div>
        <form action={placeAction} className="mt-4">
          {selectedRows.map((r) => (
            <input key={r.id} type="hidden" name="cartItemId" value={r.id} />
          ))}
          <Button type="submit" className="w-full" disabled={placing || mutating || selectedRows.length === 0}>
            <ShoppingCartIcon data-icon="inline-start" />
            {placing ? "提交中…" : selectedRows.length === 0 ? "请选择商品" : "提交订单"}
          </Button>
        </form>
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移除商品？</AlertDialogTitle>
            <AlertDialogDescription>
              确认将「{deleteTarget?.name}」移出购物车？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
