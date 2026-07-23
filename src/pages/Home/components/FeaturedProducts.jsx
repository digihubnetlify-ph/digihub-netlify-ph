import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ProductCard } from "../../../components";
import { FeaturedRowSkeleton } from "../../../components/Elements/Skeleton";
import { getFeaturedList } from "../../../services";

export const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getFeaturedList();
        setProducts(data);
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <FeaturedRowSkeleton />;

  return (
    <section className="my-10">
      <h1 className="text-2xl text-center font-semibold dark:text-slate-100 mb-5 underline underline-offset-8">
        Featured Movies
      </h1>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    </section>
  );
};
