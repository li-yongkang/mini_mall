"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createCategory, deleteCategory, type AdminActionState } from "@/actions/admin";

type CategoryData = { id: string; name: string; productCount: number };

/** 分类管理交互区：新建表单 + 删除（二次确认，有关联商品时服务端拒绝） */
export function CategoryManager({ categories }: { categories: CategoryData[] }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    createCategory,
    undefined
  );
  const prevState = useRef(state);
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [deleting, startDeleting] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;
    if (state?.error) toast.error(state.error);
    else if (state?.ok) {
      toast.success("分类已创建");
      formRef.current?.reset();
    }
  }, [state]);

  const confirmDelete = () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    startDeleting(async () => {
      const result = await deleteCategory(target.id);
      if (result?.error) toast.error(result.error);
      else toast.success(`已删除分类「${target.name}」`);
    });
  };

  return (
    <div className="max-w-xl space-y-6">
      <form ref={formRef} action={formAction} className="flex gap-2">
        <Input name="name" placeholder="新分类名称（如：美妆）" className="max-w-64" required />
        <Button type="submit" disabled={pending}>
          {pending ? "创建中…" : "新建分类"}
        </Button>
      </form>

      <div className="rounded-xl border">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-2 border-b p-3 last:border-b-0"
          >
            <div>
              <span className="font-medium">{category.name}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {category.productCount} 件商品
              </span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={() => setDeleteTarget(category)}
            >
              <Trash2Icon data-icon="inline-start" />
              删除
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分类？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除「{deleteTarget?.name}」分类。若该分类下仍有商品，删除将被拒绝。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
