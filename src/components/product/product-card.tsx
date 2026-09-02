import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: { name: string };
  };
};

/** 商品卡片（服务端组件）：首页与列表页共用 */
export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform group-hover/card:scale-105"
          />
        </div>
        <CardContent className="flex flex-1 flex-col gap-1.5 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-medium">{product.name}</h3>
            <Badge variant="secondary" className="shrink-0">
              {product.category.name}
            </Badge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          <span className="mt-auto pt-2 text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
        </CardContent>
      </Link>
    </Card>
  );
}
