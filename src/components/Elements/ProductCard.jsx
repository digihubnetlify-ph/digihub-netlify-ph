import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context";
import { useOwnedStreamUrl } from "../../context";
import { Rating } from "./Rating";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { toStreamUrl } from "../../services";

// Poster is the primary preview trigger: click it to watch the trailer if
// one exists, otherwise it just behaves like a normal link to the product
// page. The title text always links to the product page regardless.
// Declared outside ProductCard so it isn't recreated (and its children,
// like the poster <img>, remounted) on every render.
const PosterWrapper = ({ hasTrailer, onPreview, id, name, className, children }) =>
  hasTrailer ? (
    <div
      onClick={onPreview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPreview(e)}
      aria-label={`Preview ${name}`}
      className={className}
    >
      {children}
    </div>
  ) : (
    <Link to={`/products/${id}`} className={className}>
      {children}
    </Link>
  );

export const ProductCard = ({ product, compact = false }) => {
  const { cartList, addToCart, removeFromCart } = useCart();
  const [nowPlaying, setNowPlaying] = useState(null); // { name, url } | null
  const navigate = useNavigate();
  const { id, name, overview, poster, price, rating, best_seller, trailer_url, type } = product;
  // Watch Online / Preview are a movie-only feature — Videos and Music keep
  // the plain Add/Remove flow, nothing else changes for them.
  const isMovie = type === "movie";
  // Only set if the current visitor has a CONFIRMED paid order for this
  // product — never a guess from cart state. See OwnershipContext.
  const ownedStreamUrl = useOwnedStreamUrl(id);

  // Derived directly from cartList — no need for its own state/effect,
  // which would otherwise cost an extra render every time cartList changes.
  const inCart = cartList.some(item => item.id === product.id);

  function handleWatchOnline(e) {
    e.preventDefault(); // these buttons sit inside a <Link>, stop it navigating
    if (ownedStreamUrl) {
      setNowPlaying({ name, url: ownedStreamUrl });
      return;
    }
    addToCart(product);
    navigate("/cart");
  }

  function handlePreview(e) {
    e.preventDefault();
    setNowPlaying({ name: `${name} — Preview`, url: toStreamUrl(trailer_url) });
  }

  const hasTrailer = isMovie && !!trailer_url;

  // Compact card for Featured section
  if (compact) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group cursor-pointer w-[calc(50%-0.375rem)] sm:w-40 md:w-44">
        <PosterWrapper hasTrailer={hasTrailer} onPreview={handlePreview} id={id} name={name} className="relative block overflow-hidden rounded-lg bg-black">
          {best_seller && (
            <span className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded">
              🔥
            </span>
          )}
          {hasTrailer && (
            <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <i className="bi bi-play-circle-fill text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"></i>
            </span>
          )}
          <img
            className="w-full aspect-[2/3] object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            src={poster}
            alt={name}
            onError={(e) => { e.currentTarget.style.visibility = "hidden" }}
          />
          <span className="absolute bottom-1.5 right-1.5 bg-black bg-opacity-80 text-white text-xs font-bold px-2 py-1 rounded">
            ₱{price.toLocaleString()}
          </span>
        </PosterWrapper>
        <div className="flex flex-col flex-1 pt-2.5 px-1.5 pb-2.5">
          <Link to={`/products/${id}`}>
            <h3 className="text-sm sm:text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1 group-hover:text-red-500 transition-colors">
              {name}
            </h3>
          </Link>
          <div className="flex items-center mb-1.5">
            <Rating rating={rating} size="text-xs" />
          </div>

          {/* Button stack anchored to the bottom via mt-auto — keeps Add
              lined up across every card in a row regardless of whether
              Preview shows above it. */}
          <div className="mt-auto">
            {/* Preview + Watch Online — movies only. */}
            {isMovie && (
              <div className="flex flex-col gap-1 mb-1">
                {trailer_url && (
                  <button
                    onClick={handlePreview}
                    className="w-full text-[11px] bg-slate-600 hover:bg-slate-700 text-white font-medium px-1 py-1 rounded-full transition-colors truncate"
                  >
                    <i className="bi bi-film mr-0.5"></i>Preview
                  </button>
                )}
                <button
                  onClick={handleWatchOnline}
                  className="w-full text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-medium px-1 py-1 rounded-full transition-colors truncate"
                >
                  <i className="bi bi-play-fill mr-0.5"></i>Watch Online
                </button>
              </div>
            )}

            {ownedStreamUrl ? (
              <button
                disabled
                className="w-full text-sm sm:text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium px-2 py-1.5 sm:py-1 rounded-full mt-1 cursor-default"
              >
                <i className="bi bi-check-circle-fill mr-1"></i>Purchased
              </button>
            ) : !inCart ? (
              <button
                onClick={() => addToCart(product)}
                disabled={!product.in_stock}
                className="w-full text-sm sm:text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium px-2 py-1.5 sm:py-1 rounded-full transition-colors mt-1"
              >
                <i className="bi bi-cart-plus mr-1"></i>Add to Cart
              </button>
            ) : (
              <button
                onClick={() => removeFromCart(product)}
                className="w-full text-sm sm:text-xs bg-gray-700 hover:bg-gray-800 text-white font-medium px-2 py-1.5 sm:py-1 rounded-full transition-colors mt-1"
              >
                <i className="bi bi-trash3 mr-1"></i>Remove
              </button>
            )}
          </div>
        </div>

        <VideoPlayerModal nowPlaying={nowPlaying} onClose={() => setNowPlaying(null)} />
      </div>
    );
  }

  // Full card for Products page
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group cursor-pointer w-full">
      <PosterWrapper hasTrailer={hasTrailer} onPreview={handlePreview} id={id} name={name} className="relative block overflow-hidden rounded-xl">
        {best_seller && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded">
            Best Seller
          </span>
        )}
        {hasTrailer && (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <i className="bi bi-play-circle-fill text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"></i>
          </span>
        )}
        <img
          className="w-full aspect-video object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
          src={poster}
          alt={name}
        />
        <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs font-bold px-2 py-1 rounded">
          ₱{price.toLocaleString()}
        </span>
      </PosterWrapper>

      <div className="flex flex-col flex-1 gap-3 pt-3 px-1 pb-2">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
            DH
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/products/${id}`}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1 group-hover:text-red-500 transition-colors">
                {name}
              </h3>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
              DigiHub
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {overview}
            </p>
            <div className="flex items-center gap-2">
              <Rating rating={rating} />
            </div>
          </div>
        </div>

        {/* Button stack anchored to the bottom via mt-auto — keeps Add to
            Cart lined up across every card in a row, whether the card above
            it has 1, 2, or 3 buttons (Preview is conditional on trailer_url,
            Watch Online only shows for movies). */}
        <div className="mt-auto pl-12">
          {/* Preview + Watch Online — movies only. */}
          {isMovie && (
            <div className="flex flex-col gap-1.5 mb-2 max-w-xs">
              {trailer_url && (
                <button
                  onClick={handlePreview}
                  className="w-full text-xs bg-slate-600 hover:bg-slate-700 text-white font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  <i className="bi bi-film mr-1"></i>Preview
                </button>
              )}
              <button
                onClick={handleWatchOnline}
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <i className="bi bi-play-fill mr-1"></i>Watch Online — ₱{price}
              </button>
            </div>
          )}

          <div className="max-w-xs">
            {ownedStreamUrl ? (
              <button
                disabled
                className="w-full text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium px-3 py-1.5 rounded-full cursor-default"
              >
                <i className="bi bi-check-circle-fill mr-1"></i>Purchased
              </button>
            ) : !inCart ? (
              <button
                onClick={() => addToCart(product)}
                disabled={!product.in_stock}
                className="w-full text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <i className="bi bi-cart-plus mr-1"></i>Add to Cart
              </button>
            ) : (
              <button
                onClick={() => removeFromCart(product)}
                className="w-full text-xs bg-gray-700 hover:bg-gray-800 text-white font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <i className="bi bi-trash3 mr-1"></i>Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <VideoPlayerModal nowPlaying={nowPlaying} onClose={() => setNowPlaying(null)} />
    </div>
  );
};