"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteProduct, toggleProductActive } from "@/actions/admin";

type ProductRowActionsProps = {
  productId: string;
  productName: string;
  isActive: boolean;
};

/** 商品列表行操作：上/下架切换 + 删除（AlertDialog 二次确认） */
export function ProductRowActions({ productId, productName, isActive }: ProductRowActionsProps) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onToggle = () =>
    startTransition(async () => {
      const result = await toggleProductActive(productId, !isActive);
      if (result?.error) toast.error(result.error);
    });

  const onDelete = () =>
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result?.error) toast.error(result.error);
      else toast.success(`已删除「${productName}」`);
    });

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onToggle}
      >
        {isActive ? "下架" : "上架"}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon data-icon="inline-start" />
          删除
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除商品？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除「{productName}」，历史订单不受影响（保留快照）。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
