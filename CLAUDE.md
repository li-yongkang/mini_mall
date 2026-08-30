@AGENTS.md

# Mini Mall 微型电商项目

学习/演示性质的微型电商，覆盖完整闭环：商品浏览 → 注册登录 → 购物车 → 下单 → 模拟支付 → 订单管理 + 后台管理 + 心悦会员体系。SQLite 单机存储，无真实支付与文件上传，UI 文案全中文。

## 技术栈

- **Next.js 16**（App Router）+ TypeScript + React 19 + **Prisma 5** + **SQLite** + **Tailwind CSS 4** + **shadcn/ui**
- 认证：自研 Session —— bcryptjs 哈希 + jose 签发 JWT 存 httpOnly Cookie，Server Actions 实现
- 商品图片：`imageUrl` 字段 + `public/images/` 本地 SVG 占位图

## 关键约定

- **价格一律用"分"存 Int**，展示层用 `lib/format.ts` 的 `formatPrice` 转 "¥xx.xx"，严禁浮点运算
- **订单状态用 String + TS 联合类型**（`lib/constants.ts` 定义），Prisma 5 + SQLite 不支持 enum 块；状态机：`PENDING → PAID | CANCELLED`，`PAID → SHIPPED`
- **路由保护用 `proxy.ts`**（Next 16 已废弃 middleware.ts），matcher 覆盖 `/cart /orders /member /admin`；权限最终以 DB 为准（`lib/auth.ts` 的 requireUser/requireAdmin 回源查询）
- **Next 16 API 全部 async**：`params` / `searchParams` / `cookies()` / `headers()` 必须 await，客户端组件用 `React.use()` 解包
- `redirect()` 抛 NEXT_REDIRECT 异常，**不要包 try/catch**；客户端 `useSearchParams()` 必须包 `<Suspense>`
- PrismaClient 单例放 `lib/db.ts`（globalThis 缓存）；`DATABASE_URL="file:./dev.db"` 相对 `prisma/` 目录解析
- 数据变更后记得 `revalidatePath`

## 心悦会员体系

| 等级 | 累计消费（已支付订单，分） | 下单折扣 |
|---|---|---|
| 普通会员 | < 800,000（¥8,000） | 无 |
| 心悦1级 | ≥ 800,000 | 98折 |
| 心悦2级 | ≥ 8,000,000（¥80,000） | 95折 |
| 心悦3级 | ≥ 80,000,000（¥800,000） | 9折 |

- 等级由 `User.totalSpent` 实时推导（`lib/member.ts` 的 `getMemberInfo`），不落库
- 下单按当前等级计价："后续享受"语义——本单支付跨阈值，下一单起生效
- `payOrder` 事务：订单置 PAID + `user.totalSpent += totalAmount`；取消订单回补库存但不动 totalSpent
- Order 存 `discountPercent`、`memberLevel` 快照，OrderItem 存 name/price/imageUrl 快照（price 为原价），历史订单不受商品/等级后续变化影响

## 目录结构

```
src/proxy.ts                # 路由保护（验签 JWT cookie）
prisma/                     # schema.prisma、seed.ts、dev.db
public/images/              # product-1.svg ~ 6.svg 占位图
src/
├─ app/                     # 前台：/ /products /cart /orders /member /login /register
│  └─ admin/                # 后台：layout 守卫 + 统计/商品CRUD/订单/分类
├─ actions/                 # Server Actions：auth.ts cart.ts order.ts admin.ts
├─ components/              # ui/（shadcn 生成）+ 业务组件
└─ lib/                     # db.ts jwt.ts session.ts auth.ts member.ts constants.ts format.ts
```

## 常用命令

```bash
npm run dev          # 开发（Turbopack）
npm run lint         # eslint .（Next 16 已移除 next lint）
npm run build        # 构建
npm run db:push      # schema 变更同步（开发期用）
npm run db:migrate   # prisma migrate dev
npm run db:seed      # 种子数据（管理员 admin@example.com / admin123）
npm run db:studio    # prisma studio
npm run db:reset     # db push --force-reset（须先停 dev server，否则 SQLITE_BUSY）
```

## 注意

- shadcn 初始化后已删除 globals.css 默认 `:root` hex 变量块（与 OKLCH 变量冲突），改样式直接编辑 globals.css 的 `@theme`
- bcryptjs 纯 JS 版，勿装 bcrypt（Windows 卡 node-gyp）
- 改 `.env` 后必须重启 dev
- 种子 admin123 为演示弱口令，生产必须改

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成这份工作时使用
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
