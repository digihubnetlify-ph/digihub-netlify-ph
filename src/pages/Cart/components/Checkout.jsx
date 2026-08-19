import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../../context";
import { createOrder, getUser } from "../../../services";
import { supabase } from "../../../services/supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const GUEST_EMAIL = import.meta.env.VITE_GUEST_LOGIN;

// Declared outside Checkout so it isn't recreated (and remounted, losing
// its DOM state) every time Checkout re-renders — e.g. on every payment
// method click.
const ModalShell = ({ onClose, children }) => (
  <section>
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40"></div>
    <div className="overflow-y-auto overflow-x-hidden fixed inset-0 z-50 w-full flex justify-center items-start p-4" aria-modal="true" role="dialog">
      <div className="relative w-full max-w-md my-8">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-2.5 z-10 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
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

export const Checkout = ({ setCheckout }) => {
  const { cartList, total } = useCart();
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

  async function handlePayment() {
    if (!selectedMethod) {
      toast.error("Please select a payment method!", { position: "bottom-center" });
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder(cartList, total, user);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/paymongo-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          payment_method: selectedMethod,
          success_url: `${window.location.origin}/order-summary`,
          cancel_url: `${window.location.origin}/cart`,
        }),
      });

      const result = await response.json();
      console.log("Full result:", JSON.stringify(result));

      const checkoutUrl = result?.data?.attributes?.checkout_url;

      if (checkoutUrl) {
        // Cart is intentionally NOT cleared here. Clearing it now would wipe
        // it out even if the customer cancels or hits back on PayMongo's page.
        // It's cleared instead in OrderSuccess, once payment is confirmed.
        //
        // Redirect this same tab straight to PayMongo. A new-tab/popup
        // approach was tried here but browsers block window.open() far too
        // often (especially on localhost and mobile) to be reliable — a
        // plain, direct redirect is the standard pattern hosted checkouts
        // expect, and it plays nicely with the browser's own back button.
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
    // { id: "gcash",    label: "GCash",                               icon: "bi bi-wallet2",     color: "bg-blue-500"   },
    // { id: "paymaya",  label: "Maya",                                icon: "bi bi-phone",        color: "bg-green-500"  },
    // { id: "card",     label: "Credit / Debit Card",                 icon: "bi bi-credit-card",  color: "bg-gray-700"   },
    { id: "qrph",     label: "QR Ph (GCash, Maya, BPI, BDO +30 more)", icon: "bi bi-qr-code", color: "bg-orange-500" },
  ];

  // ─── Modal shell (shared by all states) ──────────────────────────────────────

  // ─── Still loading user ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <ModalShell onClose={() => setCheckout(false)}>
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
      <ModalShell onClose={() => setCheckout(false)}>
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
    <ModalShell onClose={() => setCheckout(false)}>
      <div className="py-6 px-6 lg:px-8">
        <h3 className="mb-2 pr-8 text-xl font-medium text-gray-900 dark:text-white">
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
              <span className={`${method.color} text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>
                <i className={method.icon}></i>
              </span>
              <span className="font-medium text-gray-900 dark:text-white flex-1 min-w-0 text-left">{method.label}</span>
              {selectedMethod === method.id && (
                <i className="bi bi-check-circle-fill text-blue-500 flex-shrink-0 self-start mt-1"></i>
              )}
            </button>
          ))}
        </div>

        {selectedMethod === "qrph" && (
          <div className="mb-6 p-4 rounded-lg bg-orange-50 border border-orange-200 dark:bg-gray-800 dark:border-gray-600">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3">
              <i className="bi bi-info-circle mr-1"></i>
              Paano Magbayad gamit ang QR Ph / How to Pay via QR Ph
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <li>
                <span className="font-medium">Pindutin ang "PAY NOW" sa ibaba.</span>
                <br />
                Click "PAY NOW" below.
              </li>
              <li>
                <span className="font-medium">Ide-redirect ka sa secure na payment page ng PayMongo.</span>
                <br />
                You'll be redirected to PayMongo's secure payment page.
              </li>
              <li>
                <span className="font-medium">
                  I-download ang QR code (o i-screenshot ito) gamit ang
                  "Download QR Code" button doon.
                </span>
                <br />
                Download the QR code shown there (or take a screenshot) using
                the "Download QR Code" button.
              </li>
              <li>
                <span className="font-medium">
                  Buksan ang iyong GCash, Maya, o banking app sa phone mo.
                </span>
                <br />
                Open your GCash, Maya, or banking app on your phone.
              </li>
              <li>
                <span className="font-medium">
                  Pindutin ang "Scan QR" sa app, pagkatapos i-upload o
                  i-scan ang na-download na QR code.
                </span>
                <br />
                Tap "Scan QR" in the app, then upload or scan the downloaded
                QR code image.
              </li>
              <li>
                <span className="font-medium">
                  Suriin ang halaga (amount) at kumpirmahin ang bayad.
                </span>
                <br />
                Check the amount and confirm the payment.
              </li>
              <li>
                <span className="font-medium">
                  Pagkatapos magbayad, pindutin ang "Back" sa iyong
                  browser para bumalik sa Digihub.
                </span>
                <br />
                After paying, tap your browser's "Back" button to return
                to Digihub — your order status will update automatically
                once payment is confirmed.
              </li>
            </ol>
            <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 italic">
              Tip: Huwag isara ang browser tab habang naghihintay ng
              kumpirmasyon. / Tip: Don't close the browser tab while waiting
              for confirmation.
            </p>
          </div>
        )}

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
