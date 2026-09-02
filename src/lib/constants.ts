// 商品列表排序选项（/products?sort=）
export const PRODUCT_SORTS = [
  { value: "latest", label: "最新上架" },
  { value: "priceAsc", label: "价格从低到高" },
  { value: "priceDesc", label: "价格从高到低" },
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

// 商品列表每页数量
export const PRODUCTS_PAGE_SIZE = 12;

// 订单状态（Prisma 5 + SQLite 不支持 enum 块，String 字段 + TS 联合类型约束）
// 状态机：PENDING → PAID | CANCELLED；PAID → SHIPPED
export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  SHIPPED: "已发货",
  CANCELLED: "已取消",
};
