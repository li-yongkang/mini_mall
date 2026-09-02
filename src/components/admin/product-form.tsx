"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct, type AdminFormState } from "@/actions/admin";

export const PRODUCT_IMAGE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: `/images/product-${i + 1}.svg`,
  label: `占位图 ${i + 1}`,
}));

type ProductFormProps = {
  categories: { id: string; name: string }[];
  /** 编辑模式：传入现有商品（价格以元字符串呈现） */
  product?: {
    id: string;
    name: string;
    description: string;
    price: number; // 分
    stock: number;
    imageUrl: string;
    isActive: boolean;
    categoryId: string;
  };
};

/** 商品新建/编辑表单：useActionState + 服务端 zod safeParse（元 → 分由服务端转换） */
export function ProductForm({ categories, product }: ProductFormProps) {
  const isEdit = product !== undefined;
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, undefined);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;
    if (state?.error) toast.error(state.error);
  }, [state]);

  const [imageValue, setImageValue] = useState(product?.imageUrl ?? PRODUCT_IMAGE_OPTIONS[0].value);
  const [categoryValue, setCategoryValue] = useState(product?.categoryId ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {isEdit && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-1.5">
        <Label htmlFor="name">商品名称</Label>
        <Input id="name" name="name" defaultValue={product?.name} placeholder="如：无线蓝牙耳机" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">商品描述</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} placeholder="商品卖点与参数说明" rows={4} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">价格（元）</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={product ? (product.price / 100).toFixed(2) : ""}
            placeholder="如：199.00"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">库存（件）</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>分类</Label>
          <Select value={categoryValue} onValueChange={(v) => setCategoryValue(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="categoryId" value={categoryValue} />
        </div>
        <div className="space-y-1.5">
          <Label>商品图片</Label>
          <Select value={imageValue} onValueChange={(v) => setImageValue(v ?? PRODUCT_IMAGE_OPTIONS[0].value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_IMAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="imageUrl" value={imageValue} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Base UI Checkbox 非原生 input：受控 + hidden input 提交 */}
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <input type="hidden" name="isActive" value={isActive ? "on" : ""} />
        <Label htmlFor="isActive">上架（前台可见）</Label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : isEdit ? "保存修改" : "创建商品"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => history.back()}>
          返回
        </Button>
      </div>
    </form>
  );
}
