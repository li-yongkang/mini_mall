"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_SORTS } from "@/lib/constants";

type FilterBarProps = {
  /** 当前 URL 参数（服务端传入），作为受控初始值 */
  q: string;
  category: string;
  sort: string;
  categories: { id: string; name: string }[];
};

/**
 * 商品筛选栏：form method="get" 拼 URL 参数提交（page 自然重置为 1）。
 * 挂在服务端的 key 变化时重挂载，以同步 URL → 表单状态。
 */
export function FilterBar({ q, category, sort, categories }: FilterBarProps) {
  const [keyword, setKeyword] = useState(q);
  const [categoryValue, setCategoryValue] = useState(category || "all");
  const [sortValue, setSortValue] = useState(sort || "latest");

  return (
    <form method="get" action="/products" className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索商品名称或描述…"
          className="pl-8"
        />
      </div>
      <Select value={categoryValue} onValueChange={(v) => setCategoryValue(v ?? "all")}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部分类</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortValue} onValueChange={(v) => setSortValue(v ?? "latest")}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRODUCT_SORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="category" value={categoryValue} />
      <input type="hidden" name="sort" value={sortValue} />
      <Button type="submit">筛选</Button>
    </form>
  );
}
