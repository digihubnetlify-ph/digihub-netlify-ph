import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { getLatestOrder } from "../../../services"

export const OrderSuccess = ({ data }) => {
  const [order, setOrder] = useState(data || null)
  const [loading, setLoading] = useState(true)
  const [downloadStatus, setDownloadStatus] = useState({}) // { [productId]: 'downloading' | 'done' | 'failed' }
  const autoDownloadDone = useRef(false)

  useEffect(() => {
    if (autoDownloadDone.current) return
    autoDownloadDone.current = true

    async function fetchAndAutoDownload() {
      try {
        let latestOrder = data
        if (!latestOrder) {
          latestOrder = await getLatestOrder()
          setOrder(latestOrder)
        }

        const items = latestOrder.cart_list.filter(item => item.dlUrl)
        items.forEach((product, index) => {
          setTimeout(() => {
            autoDownload(product.dlUrl, product.name, product.id)
          }, index * 2000)
        })

      } catch (error) {
        console.error("Failed to fetch order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndAutoDownload()
  }, [])

  function autoDownload(url, name, id) {
    setDownloadStatus(prev => ({ ...prev, [id]: 'downloading' }))

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Network error")
        return res.blob()
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = name || "movie"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000)
        setDownloadStatus(prev => ({ ...prev, [id]: 'done' }))
      })
      .catch(() => {
        // Auto-download failed, show button
        setDownloadStatus(prev => ({ ...prev, [id]: 'failed' }))
      })
  }

  function manualDownload(url, name, id) {
    setDownloadStatus(prev => ({ ...prev, [id]: 'downloading' }))

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Network error")
        return res.blob()
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = name || "movie"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000)
        setDownloadStatus(prev => ({ ...prev, [id]: 'done' }))
      })
      .catch(() => {
        window.open(url, "_blank")
        setDownloadStatus(prev => ({ ...prev, [id]: 'done' }))
      })
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
                  {/* Auto downloading */}
                  {downloadStatus[product.id] === 'downloading' && (
                    <div className="flex items-center justify-center gap-2 text-blue-500 text-base py-3">
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      Downloading {product.name}...
                    </div>
                  )}

                  {/* Auto download success */}
                  {downloadStatus[product.id] === 'done' && (
                    <div className="flex items-center justify-center gap-2 text-green-500 text-base py-3">
                      <i className="bi bi-check-circle-fill"></i>
                      {product.name} downloaded successfully! ✅
                    </div>
                  )}

                  {/* Auto download failed — show button */}
                  {downloadStatus[product.id] === 'failed' && (
                    <button
                      onClick={() => manualDownload(product.dlUrl, product.name, product.id)}
                      className="flex items-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-semibold px-8 py-3 rounded-xl shadow-lg transition-all w-full justify-center"
                    >
                      <i className="bi bi-download text-xl"></i>
                      Download {product.name}
                    </button>
                  )}

                  {/* Not yet triggered */}
                  {!downloadStatus[product.id] && (
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-base py-3 animate-pulse">
                      <i className="bi bi-hourglass-split"></i>
                      Preparing {product.name}...
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

          <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">
            You can also download anytime from your{" "}
            <Link to="/dashboard" className="text-blue-500 underline">Dashboard</Link>.
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
