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
    const { amount, description, payment_method, success_url, cancel_url, name, email } = await req.json();

    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(secretKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              name: name,
              email: email,
            },
            line_items: [
              {
                currency: "PHP",
                amount: amount * 100,
                name: description,
                quantity: 1,
              },
            ],
            payment_method_types: [payment_method, "qrph"],
            success_url: success_url,
            cancel_url: cancel_url,
            description: description,
          },
        },
      }),
    });

    const data = await response.json();
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