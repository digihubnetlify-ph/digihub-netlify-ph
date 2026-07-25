import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Only order_id and payment choices come from the client. ──────────
    // Amount, billing name/email, and the cart contents are NEVER trusted
    // from the request body — they're re-derived server-side below from the
    // order row the user already owns and the live product prices.
    const { order_id, payment_method, success_url, cancel_url } = await req.json();

    if (!order_id || !payment_method || !success_url || !cancel_url) {
      return json({ error: "Missing required fields." }, 400);
    }

    // ── 2. Identify the caller from their Supabase auth token. ──────────────
    // This function must be deployed with verify_jwt = true (see config.toml)
    // so `req` only reaches here with a real Supabase session token attached.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role client: bypasses RLS, but every access below is manually
    // scoped to the authenticated caller.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return json({ error: "Not authenticated." }, 401);
    }
    const user = userData.user;

    // ── 3. Load the order and confirm the caller actually owns it. ──────────
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, user_name, user_email, cart_list, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return json({ error: "Order not found." }, 404);
    }
    if (order.user_id !== user.id) {
      return json({ error: "This order does not belong to you." }, 403);
    }
    if (order.status !== "pending") {
      return json({ error: `Order already ${order.status}.` }, 409);
    }

    // ── 4. Recompute the price from real product data. ──────────────────────
    // cart_list only supplies which product ids were ordered; the price is
    // always looked up fresh here, never taken from the client or even from
    // the order row (which was written from client-supplied data).
    const cartList = Array.isArray(order.cart_list) ? order.cart_list : [];
    const productIds = cartList.map((item: { id: number }) => item.id);

    if (productIds.length === 0) {
      return json({ error: "Order has no items." }, 400);
    }

    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, price")
      .in("id", productIds);

    if (productsError) {
      return json({ error: "Could not verify product prices." }, 500);
    }

    const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
    let verifiedTotal = 0;
    for (const item of cartList) {
      const price = priceById.get(item.id);
      if (price === undefined) {
        return json({ error: `Product ${item.id} no longer exists.` }, 400);
      }
      verifiedTotal += price;
    }
    verifiedTotal = Math.round(verifiedTotal * 100) / 100;

    if (verifiedTotal <= 0) {
      return json({ error: "Invalid order total." }, 400);
    }

    // Persist the verified total so the order record always reflects the
    // real, server-computed price — not whatever the client happened to send.
    await admin.from("orders").update({ amount_paid: verifiedTotal }).eq("id", order.id);

    // ── 5. Create the PayMongo checkout session for the VERIFIED amount. ────
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    const amountInCentavos = Math.round(verifiedTotal * 100);

    const description = `DigiHub PH Order #${order.id}`;
    const billingName = order.user_name || user.user_metadata?.name || "Customer";
    const billingEmail =
      order.user_email ||
      user.email ||
      (user.phone ? `${user.phone.replace(/\D/g, "")}@digihubph-noemail.com` : undefined);

    const paymongoRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(secretKey + ":")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            description,
            line_items: [{ currency: "PHP", amount: amountInCentavos, name: description, quantity: 1 }],
            payment_method_types: [payment_method],
            success_url,
            cancel_url,
            billing: { name: billingName, email: billingEmail },
          },
        },
      }),
    });

    const result = await paymongoRes.json();

    if (!paymongoRes.ok) {
      return json(result, paymongoRes.status);
    }

    // ── 6. Remember the checkout session id so the webhook can find this order.
    const sessionId = result?.data?.id;
    if (sessionId) {
      await admin.from("orders").update({ checkout_session_id: sessionId }).eq("id", order.id);
    }

    return json(result, 200);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});