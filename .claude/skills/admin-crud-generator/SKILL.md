---
name: admin-crud-generator
description: 当用户要求根据 Prisma 模型生成后台管理 CRUD 代码（Server Actions + shadcn/ui 管理页面，不使用 API Route）时使用，例如提到"生成CRUD""生成管理页面""后台增删改查"。
---

# 后台 CRUD 生成器（Server Actions + shadcn/ui）

## 概述

根据 Prisma 模型生成管理后台 CRUD：Server Actions 数据层 + shadcn/ui 页面层。生成前先读项目 CLAUDE.md 与现有 actions/、components/ui/ 代码，严格沿用既有约定，不引入新架构。

## 何时使用

- 用户要求为某个 Prisma 模型生成"CRUD / 管理页面 / 后台增删改查"，且模型已在 prisma/schema.prisma 中
- 不适用：前台流程（购物车/下单事务）、模型尚不存在、用户明确要求 REST API

## 执行流程

### 1. 读模型与约定

- 读 schema.prisma 目标模型：字段、@unique、关系、@default
- 读 CLAUDE.md 约定与 lib/constants.ts、lib/format.ts、lib/auth.ts、lib/db.ts
- 与用户确认：模型、路由（默认 /admin/<模型小写复数>）、表格与表单包含哪些字段

### 2. 生成 Server Actions

- 文件：追加到 src/actions/admin.ts（或按模型新建 src/actions/<model>.ts），首行 "use server"
- 每个 action 第一行 `await requireAdmin()`
- 入参统一 zod schema 校验（不依赖前端校验）
- 写操作后 `revalidatePath("/admin/xxx")`
- 价格字段：表单"元"字符串 → `Math.round(Number(元) * 100)` 转分，Int 入库，禁止浮点
- 枚举/状态字段：用 lib/constants.ts 的 TS 联合类型（String 字段），不新建 Prisma enum（SQLite 不支持）
- 删除前先查关联引用（如分类下有商品则拒绝并返回错误）；无引用再删
- 错误信息作为返回值交给 useActionState 显示

### 3. 生成管理页面

- 路由：app/admin/<model>/page.tsx（列表）、new/page.tsx、[id]/edit/page.tsx
- 列表页：服务端组件，`await searchParams` 取分页/搜索，shadcn Table，操作列放编辑/删除；价格用 formatPrice、日期用 formatDate；空态中文文案
- 表单页：共用 components/admin/<model>-form.tsx（shadcn Form = react-hook-form + zod），编辑时服务端传初始值；关联字段用 Select 从 DB 拉选项
- 删除必须 AlertDialog 二次确认；成功/失败用 sonner toast
- UI 只用 shadcn 组件（components/ui/ 已有），不裸写 Tailwind 样式

### 4. 验证

- 列出生成的文件清单
- 若改过 schema：`npx prisma generate`
- `npm run lint` 与 `npm run build` 通过
- 手动验证步骤：admin 登录 → 增/改/删 → 前台列表立即反映

## 参考模板

```ts
// src/actions/admin.ts —— 单个 action 的标准形态
"use server";

export async function createProduct(prevState: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = productSchema.parse(Object.fromEntries(formData));
  await prisma.product.create({
    data: { ...parsed, price: Math.round(Number(parsed.price) * 100) },
  });
  revalidatePath("/admin/products");
}
```

## 常见错误

- 生成 API Route（route.ts）而不是 Server Actions——本项目无 REST 层
- 忘记 await Next 16 的 params / searchParams / cookies()
- 价格浮点运算或直接存元
- 只在客户端校验表单，Server Action 内没有 zod
- 改完数据漏 revalidatePath
- 手写 Tailwind 而不是复用 shadcn 组件
