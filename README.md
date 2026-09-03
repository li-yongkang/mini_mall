# Mini Mall 微型电商

学习/演示性质的微型电商，用 AI 编程工具（Claude Code）从 0 到 1 独立完成，覆盖完整业务闭环：**商品浏览 → 注册登录 → 购物车 → 下单 → 模拟支付 → 订单管理**，外加**后台管理**与**心悦会员折扣体系**。

SQLite 单机存储，无真实支付与文件上传，UI 文案全中文。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16（App Router）+ TypeScript + React 19 |
| 数据库 | Prisma 5 + SQLite |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 认证 | 自研 Session：bcryptjs 哈希 + jose 签发 JWT 存 httpOnly Cookie，Server Actions 实现 |
| 校验 | zod（Server Actions 入参校验） |
| 图片 | `public/images/` 本地 SVG 占位图 |

## 功能

**前台**

- 商品列表（分类筛选、价格/上架时间排序、分页）+ 商品详情
- 注册 / 登录（bcryptjs 密码哈希，JWT httpOnly Cookie 会话）
- 购物车（同商品 upsert 合并、勾选结算）
- 下单：事务内校验库存并原子扣减，按会员等级实时计价
- 模拟支付 / 取消订单（取消回补库存）
- 订单管理 + 订单详情
- 心悦会员中心：等级由累计消费实时推导，展示升级进度

**后台**（`/admin`，管理员可见）

- 数据看板（用户、商品、订单、销售额统计，含待发货提醒）
- 商品 CRUD（含上下架、库存管理）
- 订单管理（详情、发货）
- 分类管理

**心悦会员体系**

| 等级 | 累计消费（已支付订单） | 下单折扣 |
|---|---|---|
| 普通会员 | < ¥8,000 | 无 |
| 心悦1级 | ≥ ¥8,000 | 98 折 |
| 心悦2级 | ≥ ¥80,000 | 95 折 |
| 心悦3级 | ≥ ¥800,000 | 9 折 |

"后续享受"语义：本单支付跨过阈值，下一单起生效。

## 关键设计约定

- **价格一律以"分"存 Int**，展示层 `lib/format.ts` 的 `formatPrice` 转 "¥xx.xx"，避免浮点运算误差
- **订单状态**：Prisma 5 + SQLite 不支持 enum 块，用 String + TS 联合类型约束状态机 `PENDING → PAID | CANCELLED`，`PAID → SHIPPED`
- **路由保护**：Next 16 用 `src/proxy.ts`（middleware.ts 已废弃）验签 JWT 作第一层，权限最终以 DB 为准（`lib/auth.ts` 的 requireUser/requireAdmin 回源查询）
- **一致性**：下单/支付/取消均在 Prisma 交互式事务内完成；支付用 `updateMany` 条件更新实现乐观锁，防并发重复支付
- **快照**：Order 存 `discountPercent`/`memberLevel`，OrderItem 存 name/price/imageUrl，历史订单不受商品与会员等级后续变化影响
- 数据变更后 `revalidatePath` 刷新缓存

## 目录结构

```
src/proxy.ts                # 路由保护（验签 JWT cookie）
prisma/                     # schema.prisma、seed.ts、dev.db
public/images/              # product-1.svg ~ 6.svg 占位图
src/
├─ app/                     # 前台：/ /products /cart /orders /member /login /register
│  └─ admin/                # 后台：layout 守卫 + 看板/商品/订单/分类管理
├─ actions/                 # Server Actions：auth.ts cart.ts order.ts admin.ts
├─ components/              # ui/（shadcn 生成）+ 业务组件
└─ lib/                     # db.ts jwt.ts session.ts auth.ts member.ts constants.ts format.ts
```

## 快速开始

```bash
npm install
npm run db:push     # 初始化 SQLite（schema 已同步）
npm run db:seed     # 种子数据：分类/商品 + 管理员
npm run dev         # http://localhost:3000
```

管理员账号：`admin@example.com` / `admin123`（演示弱口令，生产必须更换）

## 常用命令

```bash
npm run dev          # 开发（Turbopack）
npm run lint         # eslint
npm run build        # 构建
npm run db:push      # schema 变更同步（开发期用）
npm run db:migrate   # prisma migrate dev
npm run db:seed      # 种子数据
npm run db:studio    # prisma studio
npm run db:reset     # 重置数据库（须先停 dev server，否则 SQLITE_BUSY）
```

## 免责声明

本项目为学习/演示用途：无真实支付、无文件上传，数据仅存本地 SQLite，请勿用于生产环境。
