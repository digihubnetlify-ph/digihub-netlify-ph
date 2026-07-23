import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../../context";
import { createOrder, getUser } from "../../../services";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const GUEST_EMAIL = import.meta.env.VITE_GUEST_LOGIN;

export const Checkout = ({ setCheckout }) => {
  const { cartList, total, clearCart } = useCart();
  const [user, setUser] = useState(null); // null = still loading
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
        setCheckout(false);
      }
    }
    fetchData();
  }, []);

  // Many PH customers sign up with phone only and have no email on file.
  // PayMongo's hosted checkout always requires an email field to be filled,
  // so we generate a harmless placeholder from their phone number here —
  // this pre-fills that field so the customer never has to type one in.
  // It's only used for this payment session; it does NOT touch their real
  // account, and since send_email_receipt is off, nothing is ever sent to it.
  function getBillingEmail() {
    if (user.email) return user.email;
    if (user.phone) {
      const digitsOnly = user.phone.replace(/\D/g, "");
      return `${digitsOnly}@digihubph-noemail.com`;
    }
    return undefined;
  }

  async function handlePayment() {
    if (!selectedMethod) {
      toast.error("Please select a payment method!", { position: "bottom-center" });
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder(cartList, total, user);

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
          email: getBillingEmail(),
        }),
      });

      const result = await response.json();
      console.log("Full result:", JSON.stringify(result));

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
    { id: "gcash",    label: "GCash",                               icon: "bi bi-wallet2",     color: "bg-blue-500"   },
    { id: "paymaya",  label: "Maya",                                icon: "bi bi-phone",        color: "bg-green-500"  },
    { id: "card",     label: "Credit / Debit Card",                 icon: "bi bi-credit-card",  color: "bg-gray-700"   },
    { id: "qrph",     label: "QR Ph (GCash, Maya, BPI, BDO +30 more)", icon: "bi bi-qr-code", color: "bg-orange-500" },
  ];

  // ─── Modal shell (shared by all states) ──────────────────────────────────────
  const ModalShell = ({ children }) => (
    <section>
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40"></div>
      <div className="mt-5 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center flex" aria-modal="true" role="dialog">
        <div className="relative p-4 w-full max-w-md h-full md:h-auto overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button
              onClick={() => setCheckout(false)}
              type="button"
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
            {children}
          </div>
        </div>
      </div>
    </section>
  );

  // ─── Still loading user ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <ModalShell>
        <div className="py-10 px-6 text-center text-gray-400 dark:text-gray-300">
          <i className="bi bi-hourglass-split text-3xl animate-pulse"></i>
          <p className="mt-3 text-sm">Loading...</p>
        </div>
      </ModalShell>
    );
  }

  // ─── Guest user — block checkout ──────────────────────────────────────────────
  if (user.email === GUEST_EMAIL) {
    return (
      <ModalShell>
        <div className="py-8 px-6 text-center">
          <div className="mb-4">
            <i className="bi bi-person-lock text-5xl text-yellow-500"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Account Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">
            You're browsing as a guest. Please create a free account or log in
            to complete your purchase and access your downloads anytime.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/register"
              onClick={() => setCheckout(false)}
              className="w-full text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <i className="bi bi-person-plus mr-2"></i>Create Free Account
            </Link>
            <Link
              to="/login"
              onClick={() => setCheckout(false)}
              className="w-full text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
            >
              <i className="bi bi-box-arrow-in-right mr-2"></i>Log In
            </Link>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Your cart items will be saved after you log in.
          </p>
        </div>
      </ModalShell>
    );
  }

  // ─── Normal checkout ──────────────────────────────────────────────────────────
  return (
    <ModalShell>
      <div className="py-6 px-6 lg:px-8">
        <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">
          <i className="bi bi-bag-check mr-2"></i>CHECKOUT
        </h3>

        <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
          <p>Name: <span className="font-medium text-gray-900 dark:text-white">{user.name}</span></p>
          <p>{user.email ? "Email" : "Mobile"}: <span className="font-medium text-gray-900 dark:text-white">{user.email || user.phone}</span></p>
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
    </ModalShell>
  );
};
