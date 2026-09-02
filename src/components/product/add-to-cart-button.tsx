"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart, type AddToCartState } from "@/actions/cart";

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  disabled?: boolean;
};

/** 详情页加购按钮：数量步进 + 提交；未登录由服务端 requireUser 拦到登录页 */
export function AddToCartButton({ productId, stock, disabled = false }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState<AddToCartState, FormData>(
    addToCart,
    undefined
  );
  const prevState = useRef(state);

  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;
    if (state?.error) toast.error(state.error);
    else if (state?.ok) toast.success("已加入购物车");
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <div className="flex items-center rounded-lg border border-input">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || quantity <= 1}
          onClick={() => setQuantity((n) => n - 1)}
          aria-label="减少数量"
        >
          <MinusIcon />
        </Button>
        <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || quantity >= stock}
          onClick={() => setQuantity((n) => n + 1)}
          aria-label="增加数量"
        >
          <PlusIcon />
        </Button>
      </div>
      <Button type="submit" disabled={disabled || pending} className="flex-1">
        <ShoppingCartIcon data-icon="inline-start" />
        {pending ? "加入中…" : disabled ? "已售罄" : "加入购物车"}
      </Button>
    </form>
  );
}
