// 商品列表排序选项（/products?sort=）
export const PRODUCT_SORTS = [
  { value: "latest", label: "最新上架" },
  { value: "priceAsc", label: "价格从低到高" },
  { value: "priceDesc", label: "价格从高到低" },
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

// 商品列表每页数量
export const PRODUCTS_PAGE_SIZE = 12;
