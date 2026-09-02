"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelOrder, payOrder } from "@/actions/order";

/** 待支付订单的操作区：模拟支付 / 取消（二次确认） */
export function PayCancelButtons({ orderId }: { orderId: string }) {
  const [paying, startPay] = useTransition();
  const [cancelling, startCancel] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = paying || cancelling;

  const onPay = () =>
    startPay(async () => {
      const result = await payOrder(orderId);
      if (result?.error) toast.error(result.error);
      else toast.success("支付成功");
    });

  const onCancel = () =>
    startCancel(async () => {
      const result = await cancelOrder(orderId);
      if (result?.error) toast.error(result.error);
      else toast.success("订单已取消");
    });

  return (
    <div className="flex gap-2">
      <Button onClick={onPay} disabled={busy}>
        {paying ? "支付中…" : "立即支付"}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger
          render={<Button variant="outline" disabled={busy}>取消订单</Button>}
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消订单？</AlertDialogTitle>
            <AlertDialogDescription>取消后库存将回补，订单无法恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onCancel}>
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
