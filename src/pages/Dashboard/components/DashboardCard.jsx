import { useState } from "react"
import { Link } from "react-router-dom"
import { VideoPlayerModal } from "../../../components"
import { Checkout } from "../../Cart/components/Checkout"

const STATUS_BADGE = {
  paid: { label: "Paid", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  pending: { label: "Payment pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  failed: { label: "Payment failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

export const DashboardCard = ({ order }) => {
  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending
  const isPaid = order.status === "paid"
  const canRetry = order.status === "pending" || order.status === "failed"
  const [nowPlaying, setNowPlaying] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)

  return (
    <div className="max-w-4xl m-auto p-2 mb-5 border dark:border-slate-700">
      <div className="flex justify-between items-center text-sm m-2 font-bold dark:text-slate-200">
        <span>Order Id: {order.id}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>{badge.label}</span>
        <span>Total: ₱{order.amount_paid.toLocaleString()}</span>
      </div>
      {!isPaid && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 -mt-3 mb-3">
          {order.status === "failed"
            ? "This payment didn't go through — no charge was made."
            : "Still waiting for payment. Already paid? This updates automatically — no need to pay twice."}
        </p>
      )}
      {order.cart_list.map((product) => {
        const url = isPaid ? product.dlUrl : null;
        const streamUrl = isPaid ? product.streamUrl : null;
        return (
          <div key={product.id} className="flex flex-wrap justify-between max-w-4xl m-auto p-2 my-5">
            <div className="flex">
              <Link to={"/products/" + product.id}>
                <img className="w-32 rounded" src={product.poster} alt={product.name} />
              </Link>
              <div>
                <Link to={"/products/" + product.id}>
                  <p className="text-lg ml-2 dark:text-slate-200">{product.name}</p>
                </Link>
                <div className="text-lg m-2 dark:text-slate-200">
                  <span>₱{product.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="self-center flex flex-col items-end gap-2">
              {url ? (
                <>
                  {streamUrl && (
                    <button
                      onClick={() => setNowPlaying({ name: product.name, url: streamUrl })}
                      className="w-32 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap"
                    >
                      <i className="bi bi-play-fill"></i> Watch Now
                    </button>
                  )}
                  <a href={url} target="_blank" rel="noreferrer" download
                    className="w-32 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                    <i className="bi bi-download"></i> Download
                  </a>
                </>
              ) : canRetry ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  <i className="bi bi-lock-fill"></i> Pay Now
                </button>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  <i className="bi bi-clock"></i> {isPaid ? "Processing..." : badge.label}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <VideoPlayerModal nowPlaying={nowPlaying} onClose={() => setNowPlaying(null)} />
      {showCheckout && <Checkout setCheckout={setShowCheckout} existingOrder={order} />}
    </div>
  )
}