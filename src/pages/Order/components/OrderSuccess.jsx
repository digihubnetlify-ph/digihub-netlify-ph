import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getLatestOrder } from "../../../services"

export const OrderSuccess = ({ data }) => {
  const [order, setOrder] = useState(data || null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    async function fetchAndDownload() {
      try {
        let latestOrder = data
        if (!latestOrder) {
          latestOrder = await getLatestOrder()
          setOrder(latestOrder)
        }

        // Auto-trigger downloads
        const urls = latestOrder.cart_list
          .map(item => item.dlUrl)
          .filter(Boolean)

        if (urls.length > 0) {
          setDownloading(true)
          urls.forEach((url, index) => {
            setTimeout(() => {
              const link = document.createElement("a")
              link.href = url
              link.download = ""
              link.target = "_blank"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }, index * 1500) // stagger downloads by 1.5s each
          })
          setTimeout(() => {
            setDownloading(false)
            setDownloaded(true)
          }, urls.length * 1500)
        }
      } catch (error) {
        console.error("Failed to fetch order:", error)
      }
    }

    fetchAndDownload()
  }, [])

  return (
    <section className="text-xl text-center max-w-4xl mx-auto my-10 py-5 dark:text-slate-100 border dark:border-slate-700 rounded">
      <div className="my-5">
        <p className="bi bi-check-circle text-green-600 text-7xl mb-5"></p>
        <p>Thank you for your order! 🎉</p>
        {order && <p className="text-base mt-2">Order ID: {order.id}</p>}
      </div>

      <div className="my-5">
        <p className="my-2 text-green-500 font-semibold">Payment Successful! ✅</p>

        {downloading && (
          <p className="text-blue-500 text-base animate-pulse my-3">
            <i className="bi bi-download mr-2"></i>Your download is starting...
          </p>
        )}

        {downloaded && (
          <p className="text-green-500 text-base my-3">
            <i className="bi bi-check2-circle mr-2"></i>Download started! Check your Downloads folder.
          </p>
        )}
      </div>

      {/* Backup download buttons */}
      {order && order.cart_list?.length > 0 && (
        <div className="my-5 px-4">
          <p className="text-base text-gray-500 dark:text-gray-400 mb-3">
            Download not starting? Use the buttons below:
          </p>
          <div className="flex flex-col gap-3 items-center">
            {order.cart_list.map((product) =>
              product.dlUrl ? (
                <a
                  key={product.id}
                  href={product.dlUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg"
                >
                  <i className="bi bi-download"></i> Download {product.name}
                </a>
              ) : (
                <span key={product.id} className="text-sm text-gray-400">
                  <i className="bi bi-clock mr-1"></i> {product.name} — Processing...
                </span>
              )
            )}
          </div>
        </div>
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
