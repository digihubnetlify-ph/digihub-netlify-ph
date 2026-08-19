// PayMongo webhook handler.
//
// This is the ONLY place that should ever mark an order "paid". The client
// is never trusted to report its own payment success — PayMongo tells us
// directly, over a channel the client can't forge (the signed webhook body).
//
// Setup (do this once you deploy):
//   1. supabase functions deploy paymongo-webhook --no-verify-jwt
//      (PayMongo can't send your Supabase auth headers, so this endpoint
//      authenticates the request itself via the signature check below —
//      it does NOT rely on Supabase's JWT verification.)
//   2. In the PayMongo Dashboard > Developers > Webhooks, create a webhook
//      pointing at:
//        https://<project-ref>.supabase.co/functions/v1/paymongo-webhook
//      Subscribe to: checkout_session.payment.paid (and payment.failed if
//      you want to record failures explicitly).
//   3. Copy the "Signing secret" shown for that webhook and set it as a
//      Supabase secret: supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsec_xxx

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Parses PayMongo's "Paymongo-Signature: t=...,te=...,li=..." header format.
function parseSignatureHeader(header: string) {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [key, ...rest] = kv.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  return { timestamp: parts.t, testSig: parts.te, liveSig: parts.li };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Signature must be verified against the RAW body — read it as text first,
  // parse as JSON only after verification passes.
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("Paymongo-Signature") ?? "";
  const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not set — refusing to process webhook.");
    return new Response("Server misconfigured", { status: 500 });
  }

  const { timestamp, testSig, liveSig } = parseSignatureHeader(signatureHeader);
  if (!timestamp || (!testSig && !liveSig)) {
    return new Response("Missing signature", { status: 401 });
  }

  const expected = await hmacSha256Hex(webhookSecret, `${timestamp}.${rawBody}`);
  const candidate = liveSig || testSig;
  if (!candidate || !timingSafeEqual(expected, candidate)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (eventType === "checkout_session.payment.paid") {
      const sessionId = resource?.id;
      if (sessionId) {
        await admin
          .from("orders")
          .update({ status: "paid" })
          .eq("checkout_session_id", sessionId)
          .eq("status", "pending"); // don't clobber an already-final row
      }
    } else if (eventType === "checkout_session.payment.failed") {
      const sessionId = resource?.id;
      if (sessionId) {
        await admin
          .from("orders")
          .update({ status: "failed" })
          .eq("checkout_session_id", sessionId)
          .eq("status", "pending");
      }
    }
    // Unhandled event types are ignored but still get a 2xx below, per
    // PayMongo's guidance, so they don't get endlessly retried.
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still return 2xx — log and handle asynchronously rather than causing
    // PayMongo to retry a webhook that already passed signature checks.
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});