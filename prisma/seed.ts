// 幂等种子数据：可重复执行，不覆盖用户已修改的数据（密码仅首次创建时写入）
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 价格单位：分；image 为 public/images/product-{n}.svg 的编号
type ProductSeed = {
  name: string;
  category: string;
  price: number;
  stock: number;
  image: number;
  description: string;
  isActive?: boolean;
};

const PRODUCT_SEEDS: ProductSeed[] = [
  // 数码
  { name: "无线蓝牙耳机", category: "数码", price: 19_900, stock: 100, image: 1, description: "主动降噪，单次续航 8 小时，搭配充电仓可用 30 小时。" },
  { name: "智能运动手表", category: "数码", price: 89_900, stock: 50, image: 2, description: "心率血氧监测，支持 100+ 运动模式，50 米防水。" },
  { name: "旗舰智能手机", category: "数码", price: 499_900, stock: 20, image: 3, description: "6.7 英寸 OLED 屏，2 亿像素主摄，新一代旗舰芯片。" },
  { name: "旗舰游戏笔记本", category: "数码", price: 999_900, stock: 10, image: 4, description: "高性能独立显卡，2.5K 240Hz 电竞屏，畅玩 3A 大作。" },
  // 服饰
  { name: "纯棉印花T恤", category: "服饰", price: 7_900, stock: 100, image: 5, description: "100% 新疆长绒棉，透气亲肤，多色印花可选。" },
  { name: "轻便跑步鞋", category: "服饰", price: 29_900, stock: 60, image: 6, description: "缓震中底，网面透气，日常慢跑与通勤皆宜。" },
  { name: "休闲牛仔裤", category: "服饰", price: 15_900, stock: 80, image: 1, description: "经典直筒版型，弹力面料，耐磨耐穿。" },
  // 食品
  { name: "每日坚果礼盒", category: "食品", price: 9_900, stock: 100, image: 2, description: "30 袋独立小包装，六种坚果科学配比，每日一袋。" },
  { name: "有机纯牛奶（12盒装）", category: "食品", price: 6_900, stock: 100, image: 3, description: "有机牧场奶源，每盒 250ml，蛋白质含量 3.6g/100ml。" },
  { name: "手工巧克力礼盒", category: "食品", price: 12_900, stock: 5, image: 4, description: "精选可可豆手工制作，24 粒混合口味，附精美礼盒。" },
  // 家居
  { name: "香薰加湿器", category: "家居", price: 24_900, stock: 40, image: 5, description: "超声波静音加湿，七彩夜灯，缺水自动断电。" },
  { name: "实木书桌", category: "家居", price: 129_900, stock: 10, image: 6, description: "白蜡木桌面，环保清漆，120cm 宽敞桌面，稳固承重。" },
  // 图书
  { name: "图解HTTP", category: "图书", price: 5_900, stock: 5, image: 1, description: "经典网络协议入门书，172 张图解轻松掌握 HTTP 原理。" },
  { name: "深入理解计算机系统", category: "图书", price: 12_900, stock: 5, image: 2, description: "CSAPP 中文版，程序员进阶必读经典。" },
  // 下架商品（验证前台不展示）
  { name: "经典手机壳", category: "数码", price: 500, stock: 50, image: 3, description: "已下架商品，仅用于验证上下架功能。", isActive: false },
];

// 演示订单：T恤 x2 + 牛仔裤 x1 = ¥317，与 totalSpent 保持一致
const DEMO_ORDER = {
  orderNo: "SEED-0001",
  items: [
    { name: "纯棉印花T恤", price: 7_900, imageUrl: "/images/product-5.svg", quantity: 2 },
    { name: "休闲牛仔裤", price: 15_900, imageUrl: "/images/product-1.svg", quantity: 1 },
  ],
} as const;

async function main() {
  // 1. 用户（密码仅在首次创建时写入，重复执行不重置）
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { isAdmin: true }, // 兜底保证管理员权限不被误改
    create: {
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "管理员",
      isAdmin: true,
    },
  });
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash: await bcrypt.hash("user123", 10),
      name: "演示用户",
    },
  });

  // 2. 分类
  const categoryIds = new Map<string, string>();
  for (const name of ["数码", "服饰", "食品", "家居", "图书"]) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds.set(name, category.id);
  }

  // 3. 商品（name 无唯一约束，用 findFirst 实现幂等）
  const productIds = new Map<string, string>();
  for (const seed of PRODUCT_SEEDS) {
    const data = {
      name: seed.name,
      description: seed.description,
      price: seed.price,
      stock: seed.stock,
      imageUrl: `/images/product-${seed.image}.svg`,
      isActive: seed.isActive ?? true,
      categoryId: categoryIds.get(seed.category)!,
    };
    const existing = await prisma.product.findFirst({ where: { name: seed.name } });
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data });
    productIds.set(seed.name, product.id);
  }

  // 4. 演示用户购物车：耳机 x1 + 坚果 x2
  for (const [name, quantity] of [
    ["无线蓝牙耳机", 1],
    ["每日坚果礼盒", 2],
  ] as const) {
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId: productIds.get(name)! } },
      update: {},
      create: { userId: user.id, productId: productIds.get(name)!, quantity },
    });
  }

  // 5. 演示订单（不存在才创建，不覆盖用户后续操作）
  const existingOrder = await prisma.order.findUnique({ where: { orderNo: DEMO_ORDER.orderNo } });
  if (!existingOrder) {
    const totalAmount = DEMO_ORDER.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdAt = new Date("2026-08-26T09:58:00+08:00");
    await prisma.order.create({
      data: {
        orderNo: DEMO_ORDER.orderNo,
        userId: user.id,
        status: "PAID",
        totalAmount,
        discountPercent: 100,
        memberLevel: 0,
        createdAt,
        paidAt: new Date("2026-08-26T10:00:00+08:00"),
        items: {
          create: DEMO_ORDER.items.map((item) => ({
            productId: productIds.get(item.name)!,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  // 6. totalSpent 与已支付订单保持一致（无论订单是否由种子创建）
  const paidOrders = await prisma.order.findMany({
    where: { userId: user.id, status: "PAID" },
    select: { totalAmount: true },
  });
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  await prisma.user.update({ where: { id: user.id }, data: { totalSpent } });

  const [userCount, categoryCount, productCount, cartCount, orderCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.cartItem.count(),
    prisma.order.count(),
  ]);
  console.log(`种子数据完成：管理员 ${admin.email}（isAdmin=${admin.isAdmin}）、演示用户 ${user.email}（totalSpent=${totalSpent} 分）`);
  console.log(`当前库内：用户 ${userCount}、分类 ${categoryCount}、商品 ${productCount}、购物车项 ${cartCount}、订单 ${orderCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
