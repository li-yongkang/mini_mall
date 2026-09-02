"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shipOrder } from "@/actions/admin";

/** 发货按钮：PAID → SHIPPED */
export function ShipButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const onShip = () =>
    startTransition(async () => {
      const result = await shipOrder(orderId);
      if (result?.error) toast.error(result.error);
      else toast.success("已发货");
    });

  return (
    <Button onClick={onShip} disabled={pending}>
      {pending ? "处理中…" : "确认发货"}
    </Button>
  );
}
