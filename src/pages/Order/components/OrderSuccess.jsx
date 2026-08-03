import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { getLatestOrder, getOrderStatusById } from "../../../services"
import { useCart } from "../../../context"

// PayMongo's hosted checkout page redirects here once IT detects the
// payment as confirmed — but that detection can lag or fail entirely if
// the browser tab lost focus while the customer was paying in the GCash
// app (background tabs get their JS timers throttled). So landing on this
// page does NOT guarantee the order is actually paid yet: our own webhook
// (the only thing allowed to mark an order "paid") may not have run.
// We poll our own order status here rather than trusting the redirect.
const POLL_INTERVAL_MS = 3000
const POLL_MAX_ATTEMPTS = 15 // ~45s of polling before we give up and point them to the Dashboard

// ─── Google Drive helpers ─────────────────────────────────────────────────────
const isGoogleDrive = (url) =>
  typeof url === "string" && url.includes("drive.google.com")

const getGDriveDirectUrl = (url) => {
  const idMatch =
    url.match(/[?&]id=([^&]+)/) ||
    url.match(/\/file\/d\/([^/]+)/) ||
    url.match(/\/d\/([^/]+)/)
  const id = idMatch?.[1]
  return id
    ? `https://drive.google.com/uc?export=download&id=${id}&confirm=t`
    : url
}
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "digihubph_downloaded"

function getDownloaded() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
  catch { return {} }
}

// FIX: key by "orderId_productId" so each order is tracked independently
function markDownloaded(orderId, productId) {
  const current = getDownloaded()
  const key = `${orderId}_${productId}`
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [key]: true }))
}

export const OrderSuccess = ({ data }) => {
  const { clearCart } = useCart()
  const [order, setOrder] = useState(data || null)
  const [loading, setLoading] = useState(!data) // skip loading spinner if data already provided
  // "checking" while we confirm the webhook has actually marked the order
  // paid, "paid" once confirmed, "failed" if PayMongo says it failed, and
  // "timeout" if we polled for a while and still heard nothing back.
  const [paymentStatus, setPaymentStatus] = useState(data?.status === "paid" ? "paid" : "checking")
  // FIX: start empty — populate AFTER order loads using order-scoped keys
  const [downloadStatus, setDownloadStatus] = useState({})
  const hasFetched = useRef(false)
  const hasCleared = useRef(false)
  const pollAttempts = useRef(0)
  const pollTimer = useRef(null)

  // Payment is only confirmed once we've verified it ourselves (see polling
  // below) — not just because PayMongo redirected here. Clear the cart only
  // once that's confirmed, so cancelling or hitting back on PayMongo's page
  // (or landing here before the webhook has run) leaves the cart untouched.
  useEffect(() => {
    if (paymentStatus !== "paid" || hasCleared.current) return
    hasCleared.current = true
    clearCart()
  }, [paymentStatus])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    if (data) {
      setLoading(false)
      if (data.status && data.status !== "paid") startPolling(data.id)
      return
    }

    async function fetchOrder() {
      try {
        const latestOrder = await getLatestOrder()
        setOrder(latestOrder)
        if (latestOrder.status === "paid") {
          setPaymentStatus("paid")
        } else if (latestOrder.status === "failed") {
          setPaymentStatus("failed")
        } else {
          // Still "pending" from our end — the webhook likely just hasn't
          // landed yet (or the auto-redirect fired before it did). Poll
          // instead of assuming success.
          startPolling(latestOrder.id)
        }
      } catch (error) {
        console.error("Failed to fetch order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    return () => clearTimeout(pollTimer.current)
  }, [])

  function startPolling(orderId) {
    async function tick() {
      pollAttempts.current += 1
      try {
        const status = await getOrderStatusById(orderId)
        if (status.status === "paid") {
          setPaymentStatus("paid")
          // Re-fetch the full order (with download links) now that it's paid.
          const fullOrder = await getLatestOrder()
          setOrder(fullOrder)
          return
        }
        if (status.status === "failed") {
          setPaymentStatus("failed")
          return
        }
      } catch (error) {
        console.error("Order status poll failed:", error)
      }

      if (pollAttempts.current >= POLL_MAX_ATTEMPTS) {
        setPaymentStatus("timeout")
        return
      }
      pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS)
    }

    pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS)
  }

  // FIX: once order is available, restore only THIS order's download history
  useEffect(() => {
    if (!order) return
    const downloaded = getDownloaded()
    const initial = {}
    order.cart_list.forEach((product) => {
      const key = `${order.id}_${product.id}`
      if (downloaded[key]) {
        initial[product.id] = "done"
      }
    })
    setDownloadStatus(initial)
  }, [order])

  function handleDownload(url, name, id) {
    setDownloadStatus(prev => ({ ...prev, [id]: "downloading" }))

    const markDone = (id) => {
      markDownloaded(order.id, id) // FIX: pass order.id for scoped key
      setDownloadStatus(prev => ({ ...prev, [id]: "done" }))
    }

    if (isGoogleDrive(url)) {
      const directUrl = getGDriveDirectUrl(url)
      window.open(directUrl, "_blank", "noopener,noreferrer")
      markDone(id)
      return
    }

    // Cloudinary / any URL: fetch to blob → seamless download
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Network error")
        return res.blob()
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = name || "movie"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000)
        markDone(id)
      })
      .catch(() => {
        window.open(url, "_blank")
        markDone(id)
      })
  }

  // ─── Still confirming with the webhook — don't claim success yet ────────────
  if (!loading && paymentStatus === "checking") {
    return (
      <section className="text-xl text-center max-w-4xl mx-auto my-10 py-5 dark:text-slate-100 border dark:border-slate-700 rounded">
        <div className="my-5">
          <p className="bi bi-hourglass-split text-yellow-500 text-7xl mb-5 animate-pulse"></p>
          <p>Confirming your payment...</p>
          {order && <p className="text-base mt-2">Order ID: {order.id}</p>}
          <p className="text-base text-gray-400 mt-4">
            This can take a few seconds, especially if you paid using the GCash app.
            No need to refresh — this page updates automatically.
          </p>
        </div>
      </section>
    )
  }

  // ─── Polled for a while and still nothing — don't leave them hanging ───────
  if (!loading && paymentStatus === "timeout") {
    return (
      <section className="text-xl text-center max-w-4xl mx-auto my-10 py-5 dark:text-slate-100 border dark:border-slate-700 rounded">
        <div className="my-5">
          <p className="bi bi-clock-history text-yellow-500 text-7xl mb-5"></p>
          <p>Still waiting on payment confirmation.</p>
          {order && <p className="text-base mt-2">Order ID: {order.id}</p>}
          <p className="text-base text-gray-400 mt-4">
            If you completed the payment, it can take a little longer to confirm.
            Check your{" "}
            <Link to="/dashboard" className="text-blue-500 underline">Dashboard</Link>{" "}
            in a bit — your download will appear there automatically once confirmed.
            If it doesn't show up, contact <span>digitalmovies.ph@gmail.com</span>.
          </p>
        </div>
      </section>
    )
  }

  // ─── PayMongo/webhook says it failed — don't show a success screen ─────────
  if (!loading && paymentStatus === "failed") {
    return (
      <section className="text-xl text-center max-w-4xl mx-auto my-10 py-5 dark:text-slate-100 border dark:border-slate-700 rounded">
        <div className="my-5">
          <p className="bi bi-exclamation-circle text-red-500 text-7xl mb-5"></p>
          <p>Payment failed, please try again!</p>
          <p className="text-base mt-4">Your order is not confirmed.</p>
          <p className="text-base">Contact <span>digitalmovies.ph@gmail.com</span> for support.</p>
        </div>
        <div className="mt-8">
          <Link
            to="/cart"
            className="text-white bg-blue-700 hover:bg-blue-800 rounded-lg text-lg px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none"
          >
            Check Cart Again <i className="ml-2 bi bi-cart"></i>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="text-xl text-center max-w-4xl mx-auto my-10 py-5 dark:text-slate-100 border dark:border-slate-700 rounded">
      <div className="my-5">
        <p className="bi bi-check-circle text-green-600 text-7xl mb-5"></p>
        <p>Thank you for your order! 🎉</p>
        {order && <p className="text-base mt-2">Order ID: {order.id}</p>}
        <p className="my-2 text-green-500 font-semibold text-lg">Payment Successful! ✅</p>
      </div>

      {loading && (
        <p className="text-base text-gray-400 animate-pulse my-5">
          <i className="bi bi-hourglass-split mr-2"></i>Preparing your downloads...
        </p>
      )}

      {!loading && order && (
        <div className="my-6 px-4">
          <div className="flex flex-col gap-4 items-center">
            {order.cart_list.map((product) =>
              product.dlUrl ? (
                <div key={product.id} className="w-full max-w-sm">

                  {/* Default: show download button */}
                  {!downloadStatus[product.id] && (
                    <>
                      <button
                        onClick={() => handleDownload(product.dlUrl, product.name, product.id)}
                        className="flex items-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-semibold px-8 py-3 rounded-xl shadow-lg transition-all w-full justify-center"
                      >
                        <i className="bi bi-download text-xl"></i>
                        Download {product.name}
                      </button>
                      {isGoogleDrive(product.dlUrl) && (
                        <p className="text-xs text-white mt-2 text-center">
                          Google may show a "can't scan this file for viruses" notice — this is standard for large files and doesn't mean anything is wrong. Click "Download anyway" to continue.
                        </p>
                      )}
                    </>
                  )}

                  {/* Downloading */}
                  {downloadStatus[product.id] === "downloading" && (
                    <div className="flex items-center justify-center gap-2 text-blue-500 text-base py-3">
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      Downloading {product.name}...
                    </div>
                  )}

                  {/* Done */}
                  {downloadStatus[product.id] === "done" && (
                    <div className="flex items-center justify-center gap-2 text-green-500 text-base py-3">
                      <i className="bi bi-check-circle-fill"></i>
                      {product.name} downloaded successfully! ✅
                    </div>
                  )}

                </div>
              ) : (
                <span key={product.id} className="text-sm text-gray-400">
                  <i className="bi bi-clock mr-1"></i> {product.name} — Processing...
                </span>
              )
            )}
          </div>

          <p className="text-base text-gray-300 dark:text-gray-500 mt-6">
            You can also download anytime from your{" "}
            <Link to="/dashboard" className="text-blue-500 underline">Dashboard</Link>.
          </p>
          <p className="text-base text-gray-300 dark:text-gray-500 mt-2">
            Please refresh/reload the download Google page if the files didn't download correctly.
          </p>
        </div>
      )}

      {!loading && !order && (
        <p className="text-base text-gray-400 my-5">
          Could not load order. Please check your{" "}
          <Link to="/dashboard" className="text-blue-500 underline">Dashboard</Link> to download.
        </p>
      )}

      <div className="mt-8">
        <Link
          to="/products"
          className="text-white bg-blue-700 hover:bg-blue-800 rounded-lg text-lg px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none"
        >
          Continue Shopping <i className="ml-2 bi bi-cart"></i>
        </Link>
      </div>
    </section>
  )
}
