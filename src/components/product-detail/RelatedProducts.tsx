import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/useCurrency";
import { Currency } from "@/lib/currency";

interface Product {
  id: string;
  title: string;
  price: number;
  currency?: string;
  images: string[] | null;
  category: string;
}

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const { formatPrice } = useCurrency();
  
  return (
    <section className="mt-16">
      <Separator className="mb-8" />
      
      <h2 className="text-2xl font-bold">Related Products</h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/product/${product.id}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                <p className="mt-1 text-lg font-bold text-primary">
                  {formatPrice(product.price, (product.currency || 'USD') as Currency)}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
