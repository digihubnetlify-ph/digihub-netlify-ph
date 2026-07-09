import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context";
import { Rating } from "./Rating";

export const ProductCard = ({ product, compact = false }) => {
  const { cartList, addToCart, removeFromCart } = useCart();
  const [inCart, setInCart] = useState(false);
  const { id, name, overview, poster, price, rating, best_seller } = product;

  useEffect(() => {
    const productInCart = cartList.find(item => item.id === product.id);
    setInCart(!!productInCart);
  }, [cartList, product.id]);

  // Compact card for Featured section
  if (compact) {
    return (
      <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group cursor-pointer w-36">
        <Link to={`/products/${id}`} className="relative block overflow-hidden rounded-lg">
          {best_seller && (
            <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded">
              🔥
            </span>
          )}
          <img
            className="w-full aspect-[2/3] object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            src={poster}
            alt={name}
          />
          <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            ₱{price.toLocaleString()}
          </span>
        </Link>
        <div className="pt-2 px-1 pb-2">
          <Link to={`/products/${id}`}>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1 group-hover:text-red-500 transition-colors">
              {name}
            </h3>
          </Link>
          {!inCart ? (
            <button
              onClick={() => addToCart(product)}
              disabled={!product.in_stock}
              className="w-full text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium px-2 py-1 rounded-full transition-colors mt-1"
            >
              <i className="bi bi-cart-plus mr-1"></i>Add
            </button>
          ) : (
            <button
              onClick={() => removeFromCart(product)}
              className="w-full text-xs bg-gray-700 hover:bg-gray-800 text-white font-medium px-2 py-1 rounded-full transition-colors mt-1"
            >
              <i className="bi bi-trash3 mr-1"></i>Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full card for Products page
  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group cursor-pointer w-full">
      <Link to={`/products/${id}`} className="relative block overflow-hidden rounded-xl">
        {best_seller && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded">
            Best Seller
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
      </Link>

      <div className="flex gap-3 pt-3 px-1 pb-2">
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
          <div className="mt-2">
            {!inCart ? (
              <button
                onClick={() => addToCart(product)}
                disabled={!product.in_stock}
                className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <i className="bi bi-cart-plus mr-1"></i>Add to Cart
              </button>
            ) : (
              <button
                onClick={() => removeFromCart(product)}
                className="text-xs bg-gray-700 hover:bg-gray-800 text-white font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <i className="bi bi-trash3 mr-1"></i>Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};