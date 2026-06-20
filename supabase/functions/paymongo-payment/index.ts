import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, description, success_url, cancel_url, name, email } = await req.json();

    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");

    // Always show all payment methods so customers can switch on PayMongo's page
    const payment_method_types = ["gcash", "paymaya", "card", "qrph"];

    const body = {
      data: {
        attributes: {
          billing: {
            name: name ?? "Customer",
            email: email ?? "",
          },
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: Math.round(amount * 100),
              name: description,
              quantity: 1,
            },
          ],
          payment_method_types,
          success_url,
          cancel_url,
        },
      },
    };

    console.log("PayMongo checkout request:", JSON.stringify(body));

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(secretKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("PayMongo response:", JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
