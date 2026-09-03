# Mini Mall 微型电商项目实现计划

## Context

从零搭建微型电商项目 Mini Mall（目录 `d:\myfiles\programs\AICoding\mini_mall`，当前为空）。目标覆盖电商核心闭环：商品浏览 → 注册登录 → 购物车 → 下单 → 模拟支付 → 订单管理 + 后台管理面板，外加**心悦会员体系**（按累计消费升级、下单享折扣）。定位学习/演示项目：SQLite 单机存储、模拟支付、不做文件上传。已确认环境：Node v20.19.4（满足 Next 16 的 20.9+ 要求）、npm 10.8.2、Windows 11 + Git Bash。

## 技术栈与已定决策（用户已确认）

- Next.js 16（App Router）+ TypeScript + **Prisma 5** + SQLite + TailwindCSS 4
- **UI**：shadcn/ui（Tailwind 4 CSS-first 初始化，CSS variables 模式，按需引入）
- **认证**：自研 Session —— bcryptjs + jose 签发签名 JWT 存 httpOnly Cookie；注册/登录/登出用 Server Actions
- **商品图片**：`imageUrl` 字段 + `public/images/` 下手写 6 个本地 SVG 占位图（离线可用，绕开 next/image remotePatterns 限制）
- **UI 文案**：中文；价格存**分**（Int），展示层统一 `formatPrice` 转"¥xx.xx"

## 心悦会员体系（用户新增需求）

按**累计消费金额**（仅统计已支付订单，取消订单不计）划分等级，等级由 `totalSpent` **实时推导**（不落库存储，阈值调整即时生效）：

| 等级 | 升级条件（累计消费） | 下单折扣 | 展示 |
|---|---|---|---|
| 普通会员 | < ¥8,000 | 无 | 普通会员 |
| 心悦1级 | ≥ ¥8,000（800,000分） | 98折（98%） | 心悦1级 |
| 心悦2级 | ≥ ¥80,000（8,000,000分） | 95折（95%） | 心悦2级 |
| 心悦3级 | ≥ ¥800,000（80,000,000分） | 9折（90%） | 心悦3级 |

规则语义：
- **"后续享受"**：下单时按用户**当前**已累计消费对应的等级计价；本单支付后 `totalSpent` 增加，若跨过阈值，**下一单**起享受新折扣
- 折扣作用于整单：`实付 = Math.round(商品原价合计 × discountPercent / 100)`（分，四舍五入）
- 订单快照 `memberLevel` + `discountPercent`，历史订单展示不受后续等级变化影响
- `payOrder` 事务中 `user.totalSpent += order.totalAmount`，与订单置 PAID 同事务

## Next.js 16 关键约束

- `params` / `searchParams` / `cookies()` / `headers()` 全部 async，必须 `await`；客户端组件用 `React.use(params)` 解包
- 路由保护文件用 **`proxy.ts`**（根目录，导出 `proxy` 函数 + `config.matcher`）——`middleware.ts` 已废弃
- Turbopack 默认开启；`next lint` 已移除，直接用 `eslint .`
- `redirect()` 抛 `NEXT_REDIRECT` 异常实现——**不要用 try/catch 包住**
- `useSearchParams()` 必须包在 `<Suspense>` 内，否则 build 报错

## 数据模型（prisma/schema.prisma）

⚠️ **Prisma 5 + SQLite 不支持 enum 块**（"connector does not support enums"）→ 状态字段用 `String` + `src/lib/constants.ts` 里的 TS 联合类型约束。

6 张表：

- **User**: id(cuid) / email @unique / passwordHash / name / isAdmin Boolean @default(false) / **totalSpent Int @default(0)（累计消费，分，仅支付时累加）** / createdAt；关系：cartItems、orders
- **Category**: id / name @unique / createdAt；关系：products
- **Product**: id / name / description @default("") / **price Int（分）** / stock Int @default(0) / imageUrl @default(占位图) / isActive Boolean @default(true)（上下架） / categoryId → Category / createdAt / updatedAt；索引 `@@index([categoryId])`、`@@index([isActive])`、`@@index([name])`
- **CartItem**: id / userId / productId / quantity Int @default(1) / createdAt / updatedAt；**`@@unique([userId, productId])`**（重复加购用 upsert 累加）；onDelete: Cascade
- **Order**: id / orderNo @unique（`MM+时间戳+4位随机`）/ userId / **status String @default("PENDING")**（PENDING | PAID | SHIPPED | CANCELLED，TS 层约束）/ totalAmount Int（实付，分）/ **discountPercent Int @default(100)（快照：本单折扣，100=无折扣）** / **memberLevel Int @default(0)（快照：下单时等级）** / paidAt DateTime? / createdAt / updatedAt；索引 `@@index([userId, createdAt])`
- **OrderItem**: id / orderId / productId / **product Product?（可选关系，商品删除后订单仍可读）** / **name、price、imageUrl 快照字段（下单时冗余，non-null，price 存原价）** / quantity；索引 `@@index([orderId])`

状态机（`lib/constants.ts`）：`PENDING → PAID | CANCELLED`；`PAID → SHIPPED`；SHIPPED/CANCELLED 终态。

`lib/db.ts` 用 `globalThis` 缓存 PrismaClient 单例（避免 dev 热重载连接泄漏）。`DATABASE_URL="file:./dev.db"` 相对 `prisma/` 目录解析。

## 目录结构

```
mini_mall/
├─ .env / .env.example      # DATABASE_URL、SESSION_SECRET；.gitignore 加 dev.db
├─ proxy.ts                 # 路由保护（Next 16 取代 middleware）
├─ prisma/schema.prisma、seed.ts、dev.db
├─ public/images/product-1.svg ~ product-6.svg
└─ src/
   ├─ app/
   │  ├─ layout.tsx         # Header（导航/登录态/购物车徽标）+ Footer；globals.css
   │  ├─ page.tsx           # 首页：分类入口 + 最新商品
   │  ├─ products/page.tsx、[id]/page.tsx    # 列表（筛选/搜索/排序/分页）、详情
   │  ├─ cart/page.tsx      # 服务端加载 + CartItemsClient 交互（含会员折扣展示）
   │  ├─ orders/page.tsx、[id]/page.tsx      # 我的订单、订单详情（支付/取消）
   │  ├─ member/page.tsx    # 会员中心：当前等级/折扣/距下一级进度
   │  ├─ login/、register/
   │  └─ admin/
   │     ├─ layout.tsx      # 权限守卫：requireAdmin()（DB 校验）
   │     ├─ page.tsx        # 统计：订单/商品/用户数、销售额
   │     ├─ products/、products/new/、products/[id]/edit/
   │     ├─ orders/、orders/[id]/
   │     └─ categories/
   ├─ actions/              # auth.ts / cart.ts / order.ts / admin.ts（全部 "use server"）
   ├─ components/
   │  ├─ ui/                # shadcn 生成
   │  ├─ layout/header.tsx
   │  ├─ product/product-card.tsx、add-to-cart-button.tsx
   │  ├─ products/filter-bar.tsx、pagination.tsx
   │  ├─ cart/cart-items-client.tsx
   │  ├─ orders/pay-cancel-buttons.tsx
   │  ├─ member/member-card.tsx   # 等级徽章 + 距下一级进度条（服务端渲染）
   │  └─ admin/product-form.tsx
   └─ lib/                  # db.ts / session.ts / auth.ts / member.ts / constants.ts / format.ts
```

## 认证设计

- **lib/session.ts**：jose HS256 签发 7 天 JWT（payload: userId/isAdmin 等）→ 存 httpOnly Cookie（sameSite: lax）；`verifySession` 过期/篡改一律返回 null
- **lib/auth.ts**：`getCurrentUser()` 每次回源 DB 查用户（权限以 DB 为权威）；`requireUser()` / `requireAdmin()` 未通过 redirect
- **三层防护**：
  1. `proxy.ts` matcher 覆盖 `/cart /orders /member /admin`：验签失败 302 → `/login?from=...`
  2. `admin/layout.tsx`：`requireAdmin()` DB 二次校验（cookie 可伪造，DB 为准）
  3. 每个 Server Action 开头 `requireUser()/requireAdmin()`
- **actions/auth.ts**：`register`（zod 校验 → bcrypt.hash(10) → 建用户 isAdmin:false → 写 cookie → redirect）、`login`（bcrypt.compare → 写 cookie → 回跳 from）、`logout`（删 cookie）
- 表单用 `useActionState`；`cookies().set()` 只能在 Server Action / Route Handler 中调用

## 会员等级推导（lib/member.ts）

```ts
export const MEMBER_LEVELS = [
  { level: 1, name: "心悦1级", minSpent: 800_000, discountPercent: 98 },     // ¥8,000
  { level: 2, name: "心悦2级", minSpent: 8_000_000, discountPercent: 95 },   // ¥80,000
  { level: 3, name: "心悦3级", minSpent: 80_000_000, discountPercent: 90 },  // ¥800,000
] as const

// 由累计消费推导当前等级（不落库）：
// level 0 / discountPercent 100 / name "普通会员"；返回下一级目标与差额用于进度展示
export function getMemberInfo(totalSpent: number): MemberInfo
```

## Server Actions 与关键数据流

| Action | 校验 | 副作用 |
|---|---|---|
| addToCart(productId, qty) | requireUser | upsert 累加（上限=库存），revalidatePath |
| updateCartItemQuantity / removeFromCart | 属主检查 | update / qty≤0 时 delete |
| **placeOrder(cartItemIds)** | 属主 + 库存 | **交互式事务**（见下），成功后 redirect 订单详情 |
| **payOrder(orderId)** | 属主 + PENDING | **事务：置 PAID + paidAt + `user.totalSpent += totalAmount`** |
| cancelOrder(orderId) | 属主 + PENDING | 置 CANCELLED + **increment 回补库存**（不动 totalSpent） |
| 商品/分类 CRUD、上下架、发货 | requireAdmin + zod | revalidatePath |

**placeOrder 事务**（`prisma.$transaction(async (tx) => ...)`）：
1. 查购物车项（`where: { id: { in: ids }, userId }` —— 属主在查询条件里，天然防越权）+ 查用户 `totalSpent`
2. 逐个校验：未下架、库存充足（不足则抛错 → 全量回滚，购物车保留，错误经 useActionState 回显）
3. `getMemberInfo(user.totalSpent)` 取当前等级与折扣；`totalAmount = Math.round(原价合计 × discountPercent / 100)`
4. 建 Order（含 `discountPercent`、`memberLevel` 快照）+ OrderItem（快照 name/price/imageUrl，price 存原价）
5. `tx.product.update({ data: { stock: { decrement: qty } } })` 原子扣库存
6. 删除已下单的购物车项
7. SQLite 写操作天然串行，事务内无并发超卖问题

## 搜索/筛选/分页（/products，服务端组件 + URL 状态）

- `await searchParams` 取 `q/category/sort/page`，组合 `Prisma.ProductWhereInput`（`isActive: true` + OR contains 搜索 + categoryId 筛选）
- 排序：priceAsc / priceDesc / 默认 createdAt desc；分页 `skip/take` + count 并行查询
- FilterBar 客户端组件用 `<form method="get">` 拼 URL；分页 Link 保留现有 query 参数
- 客户端 `useSearchParams()` 处包 `<Suspense>`

## 会员相关页面

- **/member 会员中心**（需登录）：MemberCard 显示当前等级徽章、下单折扣、累计消费、距下一级差额进度条（已是心悦3级则显示"最高等级"）
- **购物车页**：显示"心悦X级 · 本单X折"提示与预估实付（原价合计 vs 折扣后合计）
- **订单详情**：显示商品总额、会员折扣（`discountPercent` 快照）、实付；下单时等级徽章
- **Header**：登录用户显示等级徽章，点击进 /member

## 种子数据（prisma/seed.ts，tsx 执行）

- 幂等 upsert（按唯一键）：admin@example.com / admin123（isAdmin: true）、user@example.com / user123
- 5 个分类（数码/服饰/食品/家居/图书）、12 个左右商品（价格 500~999900 分、库存 5~100、imageUrl 循环取 6 个占位 SVG、部分 isActive: false 验证上下架）
- 给演示用户预置：2 条购物车项 + 1 条 PAID 订单（**totalSpent 同步设为其订单实付额**，保持一致性）

## 依赖与 scripts

- `npm i prisma@^5 @prisma/client@^5 bcryptjs jose zod`；`npm i -D tsx @types/bcryptjs`（**bcryptjs 纯 JS，勿装 bcrypt**，Windows 会卡 node-gyp）
- shadcn add：`button card input label textarea select checkbox table dialog alert-dialog dropdown-menu form badge separator skeleton pagination sonner`
- scripts：`dev / build / lint(eslint .) / db:push / db:migrate / db:seed / db:studio / db:reset`

## 实施步骤（每步可独立验证）

1. **脚手架**：`npx create-next-app@latest .`（--ts --tailwind --eslint --app --src-dir --import-alias "@/*"），清模板页 → `npm run dev` 出占位页
2. **shadcn**：init（New York + Neutral + CSS variables）+ add 组件清单；**删除 globals.css 里 create-next-app 默认 `:root` hex 变量块**（与 shadcn OKLCH 变量冲突会透明底色）；无 tailwind.config.ts，用 `@theme inline` + `tw-animate-css` → 渲染一个 Button 验证样式
3. **Prisma**：写 schema → `npx prisma migrate dev --name init` → studio 看 6 张空表
4. **认证**：session/auth/actions、login/register 页、proxy.ts、Header 登录态 → 注册→跳首页；未登录访问 /cart 被 302
5. **种子**：seed.ts + 占位 SVG → `npm run db:seed` 后 studio 有数据
6. **前台商品**：列表（筛选/搜索/排序/分页）、详情、加购 → 浏览+加购后 /cart 有数据
7. **购物车与订单**：cart 页、placeOrder 事务（含会员折扣）、订单列表/详情、payOrder（含 totalSpent 累加）/cancelOrder → 下单后库存减、购物车清空；取消回补库存
8. **会员体系**：lib/member.ts、/member 页、购物车/订单折扣展示 → 支付多单跨越 ¥8,000 阈值后下一单自动 98折
9. **后台**：admin/layout 守卫、统计页、商品 CRUD、订单管理（发货、列表显示折扣/等级快照）、分类 CRUD → 非 admin 被拦；CRUD 生效
10. **打磨**：loading.tsx、空态、not-found、toast、`npm run build` 零错误 + `eslint .` 通过

## 端到端验证清单

1. 未登录浏览：列表搜索"手机"、分类筛选、价格排序、翻页——URL 带参、刷新保留
2. 注册（重复 email 报错）→ 登录（错密码报错）→ 登出后 Header 变"登录"
3. 未登录访问 /cart /orders /member /admin 均 302 → /login?from=...，登录后回跳
4. 详情页加购（数量、重复加购累加）；未登录加购被拦
5. 购物车改数量/删除/全选/合计金额正确（分→元），显示会员折扣与预估实付
6. 下单：购物车清空、库存减少（后台对照）、订单出现在 /orders；双账号订单互不影响
7. 支付 → 已支付 + paidAt + totalSpent 增加；PENDING 取消 → 库存回补且 totalSpent 不变；已支付订单无取消按钮
8. **会员**：普通会员下单无折扣（discountPercent=100）；累计支付跨过 ¥8,000 后下一单自动 98 折，订单快照显示心悦1级；/member 进度条正确；折扣后实付金额 = round(原价×折扣) 且为整数分
9. 越权：用他人 cartItemId/orderId 调 action 无效；普通用户访问 /admin 被 redirect
10. 后台：商品增删改/上下架前台立即反映；删除有订单的商品不报错（OrderItem.product 可选）；PAID 订单发货；分类 CRUD（有关联商品时提示）
11. `npm run build` 零错误（重点：async API、Suspense）

## 风险点

- **SQLITE_BUSY**：dev server 运行时别执行 `db push --force-reset` / 删 dev.db
- Prisma 引擎首次 generate 需联网；`prisma db seed` 自动先生成 client，需装 tsx
- `redirect()` 别包 try/catch；改 `.env` 后重启 dev
- 种子 admin123 为演示弱口令，`.env.example` 注明生产必须改
- 页面调用 `cookies()` 自动变动态渲染，无需手动 force-dynamic；数据变更记得 `revalidatePath`
- 会员折扣金额一律整数运算 + 四舍五入到分，杜绝浮点误差
