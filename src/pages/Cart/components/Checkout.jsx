import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../../context";
import { createOrder, getUser } from "../../../services";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const Checkout = ({ setCheckout }) => {
  const { cartList, total, clearCart } = useCart();
  const [user, setUser] = useState({});
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUser();
        setUser(data);
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      }
    }
    fetchData();
  }, []);

  async function handlePayment() {
    if (!selectedMethod) {
      toast.error("Please select a payment method!", { position: "bottom-center" });
      return;
    }
    setLoading(true);
    try {
      // 1. Create order in Supabase first
      const order = await createOrder(cartList, total, user);

      // 2. Call Supabase Edge Function to create PayMongo Checkout Session
      const response = await fetch(`${SUPABASE_URL}/functions/v1/paymongo-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          description: `Digital Movies Order #${order.id}`,
          payment_method: selectedMethod,
          success_url: `${window.location.origin}/order-summary`,
          cancel_url: `${window.location.origin}/cart`,
          name: user.name,
          email: user.email,
        }),
      });

      const result = await response.json();
      console.log("Full result:", JSON.stringify(result));

      // PayMongo Checkout Sessions return checkout_url inside data.attributes
      const checkoutUrl = result?.data?.attributes?.checkout_url;

      if (checkoutUrl) {
        clearCart();
        window.location.href = checkoutUrl;
      } else {
        const errorMsg = result?.errors?.[0]?.detail || result?.error || "Failed to create checkout session";
        throw new Error(errorMsg);
      }
    } catch (error) {
      toast.error(error.message, { closeButton: true, position: "bottom-center" });
      navigate("/order-summary", { state: { status: false } });
    } finally {
      setLoading(false);
    }
  }

  const paymentMethods = [
    { id: "gcash", label: "GCash", icon: "bi bi-wallet2", color: "bg-blue-500" },
    { id: "paymaya", label: "Maya", icon: "bi bi-phone", color: "bg-green-500" },
    { id: "card", label: "Credit / Debit Card", icon: "bi bi-credit-card", color: "bg-gray-700" },
    { id: "qrph", label: "QR Ph (GCash, Maya, BPI, BDO +30 more)", icon: "bi bi-qr-code", color: "bg-orange-500" },
  ];

  return (
    <section>
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50"></div>
      <div className="mt-5 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center flex" aria-modal="true" role="dialog">
        <div className="relative p-4 w-full max-w-md h-full md:h-auto overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button onClick={() => setCheckout(false)} type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white">
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>

            <div className="py-6 px-6 lg:px-8">
              <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">
                <i className="bi bi-bag-check mr-2"></i>CHECKOUT
              </h3>

              <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
                <p>Name: <span className="font-medium text-gray-900 dark:text-white">{user.name || "..."}</span></p>
                <p>Email: <span className="font-medium text-gray-900 dark:text-white">{user.email || "..."}</span></p>
              </div>

              <p className="mb-4 text-2xl font-semibold text-lime-500 text-center">
                ₱{total.toLocaleString()}
              </p>

              <p className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-300">Select Payment Method:</p>

              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      selectedMethod === method.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                        : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                    }`}
                  >
                    <span className={`${method.color} text-white rounded-full w-8 h-8 flex items-center justify-center`}>
                      <i className={method.icon}></i>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{method.label}</span>
                    {selectedMethod === method.id && (
                      <i className="bi bi-check-circle-fill text-blue-500 ml-auto"></i>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || !selectedMethod}
                className="w-full text-white bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                {loading ? (
                  <span><i className="bi bi-arrow-repeat mr-2 animate-spin"></i>Processing...</span>
                ) : (
                  <span><i className="mr-2 bi bi-lock-fill"></i>PAY NOW</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
