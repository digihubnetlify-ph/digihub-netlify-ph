import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTitle } from "../hooks/useTitle";
import { Rating, VideoPlayerModal } from "../components";
import { useCart } from "../context";
import { getProduct, getOwnedStreamUrl, toStreamUrl } from "../services";
import { ProductDetailSkeleton } from "../components/Elements/Skeleton";

export const ProductDetail = () => {
  const { cartList, addToCart, removeFromCart } = useCart();
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  // Only set once we've CONFIRMED this visitor paid for this exact product —
  // never derived from cart state or a client-side guess. Gates PLAYBACK,
  // not whether the button is visible (it's always visible, same price).
  const [ownedStreamUrl, setOwnedStreamUrl] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null); // { name, url } | null
  const { id } = useParams();
  useTitle(product.name);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProduct(id);
        setProduct(data);
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [id]);

  useEffect(() => {
    // Checked for every product type — not just movies — since it also
    // drives the "Purchased" badge on the Add to Cart button below (Watch
    // Online itself stays movie-only via its own type check above).
    // Silent by design: an error here (e.g. not logged in) just means no
    // Watch Online / Purchased state — it shouldn't interrupt browsing
    // with a toast.
    getOwnedStreamUrl(id).then(setOwnedStreamUrl).catch(() => setOwnedStreamUrl(null));
  }, [id]);

  // Derived directly from cartList — no need for its own state/effect,
  // which would otherwise cost an extra render every time cartList changes.
  const inCart = cartList.some(item => item.id === product.id);

  if (loading) return <ProductDetailSkeleton />;

  return (
    <main>
      <section>
        <h1 className="mt-10 mb-5 text-4xl text-center font-bold text-gray-900 dark:text-slate-200">{product.name}</h1>
        <p className="mb-5 text-lg text-center text-gray-900 dark:text-slate-200">{product.overview}</p>
        <div className="flex flex-wrap justify-around">
          <div className="max-w-xl my-3">
            <img className="rounded" src={product.poster} alt={product.name} />
          </div>
          <div className="max-w-xl my-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-200">
              <span className="mr-1">₱</span>
              <span>{product.price}</span>
            </p>
            <p className="my-3">
              <span><Rating rating={product.rating} /></span>
            </p>
            <div className="flex flex-wrap gap-2 my-4 select-none">
              {product.best_seller && <span className="font-semibold text-amber-500 border bg-amber-50 rounded-lg px-3 py-1 text-xs sm:text-sm whitespace-nowrap">BEST SELLER</span>}
              {product.in_stock && <span className="font-semibold text-emerald-600 border bg-slate-100 rounded-lg px-3 py-1 text-xs sm:text-sm whitespace-nowrap">INSTOCK</span>}
              {!product.in_stock && <span className="font-semibold text-rose-700 border bg-slate-100 rounded-lg px-3 py-1 text-xs sm:text-sm whitespace-nowrap">OUT OF STOCK</span>}
              <span className="font-semibold text-blue-500 border bg-slate-100 rounded-lg px-3 py-1 text-xs sm:text-sm whitespace-nowrap">{product.size} MB</span>
            </div>

            {/* Preview = short trailer clip, safe for anyone, no purchase needed.
                Watch Online = same price as Add to Cart, always visible.
                Movie-only feature — Videos and Music skip straight to the
                plain Add to Cart button.
                - Already paid for it -> plays instantly (uses the CONFIRMED
                  ownedStreamUrl, never a guess).
                - Haven't bought it yet -> shows a toast telling them to add
                  to cart and check out first. No auto-add, no silent
                  cart mutation on their behalf.
                Buttons stack vertically, same width, capped at max-w-xs. */}
            <p className="my-3 flex flex-col items-stretch gap-2 max-w-xs">
              {product.type === "movie" && product.trailer_url && (
                <button
                  onClick={() => setNowPlaying({ name: `${product.name} — Preview`, url: toStreamUrl(product.trailer_url) })}
                  className="inline-flex items-center justify-center py-2 px-4 text-base font-medium text-center text-white bg-slate-600 rounded-lg hover:bg-slate-700"
                >
                  Preview <i className="ml-2 bi bi-film"></i>
                </button>
              )}

              {product.type === "movie" && (
                <button
                  onClick={() => {
                    if (ownedStreamUrl) {
                      setNowPlaying({ name: product.name, url: ownedStreamUrl });
                      return;
                    }
                    // No auto-add: don't silently stage a cart item on the
                    // visitor's behalf. They have to click "Add To Cart"
                    // themselves before checking out.
                    toast.info("Add this to your cart and complete checkout to watch online.", {
                      closeButton: true,
                      position: "bottom-center",
                    });
                  }}
                  className={`inline-flex items-center justify-center py-2 px-4 text-base font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 ${product.in_stock ? "" : "cursor-not-allowed opacity-60"}`}
                  disabled={product.in_stock ? "" : "disabled"}
                >
                  {ownedStreamUrl ? "Watch Online" : `Watch Online — ₱${product.price}`} <i className="ml-2 bi bi-play-fill"></i>
                </button>
              )}

              {ownedStreamUrl ? (
                <button
                  disabled
                  className="inline-flex items-center justify-center py-2 px-4 text-base font-medium text-center bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg cursor-default"
                >
                  Purchased <i className="ml-1 bi bi-check-circle-fill"></i>
                </button>
              ) : !inCart ? (
                <button
                  onClick={() => addToCart(product)}
                  className={`inline-flex items-center justify-center py-2 px-4 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 ${product.in_stock ? "" : "cursor-not-allowed"}`}
                  disabled={product.in_stock ? "" : "disabled"}
                >
                  Add To Cart <i className="ml-1 bi bi-plus-lg"></i>
                </button>
              ) : (
                <button
                  onClick={() => removeFromCart(product)}
                  className={`inline-flex items-center justify-center py-2 px-4 text-base font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-800 ${product.in_stock ? "" : "cursor-not-allowed"}`}
                  disabled={product.in_stock ? "" : "disabled"}
                >
                  Remove Item <i className="ml-1 bi bi-trash3"></i>
                </button>
              )}
            </p>

            <p className="text-lg text-gray-900 dark:text-slate-200">{product.long_description}</p>
          </div>
        </div>
      </section>

      <VideoPlayerModal nowPlaying={nowPlaying} onClose={() => setNowPlaying(null)} />
    </main>
  );
};