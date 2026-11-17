import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  let result = 0;

  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

async function createHmacSignature(
  secret: string,
  message: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceKey ||
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      throw new Error("Required server configuration is missing.");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required." }, 401);
    }

    const accessToken = authHeader.substring(7).trim();

    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    const { data: userData, error: userError } =
      await userClient.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return jsonResponse({ error: "Invalid user session." }, 401);
    }

    const body = await req.json();

    const campaignId = body.campaign_id;
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const receivedSignature = body.razorpay_signature;

    if (
      typeof campaignId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        campaignId,
      ) ||
      typeof orderId !== "string" ||
      !/^order_[A-Za-z0-9]+$/.test(orderId) ||
      typeof paymentId !== "string" ||
      !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
      typeof receivedSignature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(receivedSignature)
    ) {
      return jsonResponse({ error: "Invalid payment details." }, 400);
    }

    // Verify the Razorpay payment signature.
    const expectedSignature = await createHmacSignature(
      razorpayKeySecret,
      `${orderId}|${paymentId}`,
    );

    if (!safeCompare(expectedSignature, receivedSignature.toLowerCase())) {
      return jsonResponse({ error: "Payment signature verification failed." }, 400);
    }

    // Verify the payment directly with Razorpay.
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(
            `${razorpayKeyId}:${razorpayKeySecret}`,
          )}`,
        },
      },
    );

    if (!razorpayResponse.ok) {
      console.error("Razorpay payment lookup failed.");
      return jsonResponse({ error: "Unable to verify payment with Razorpay." }, 502);
    }

    const razorpayPayment = await razorpayResponse.json();

    if (
      razorpayPayment.id !== paymentId ||
      razorpayPayment.order_id !== orderId ||
      razorpayPayment.currency !== "INR" ||
      razorpayPayment.status !== "captured" ||
      !Number.isSafeInteger(razorpayPayment.amount) ||
      razorpayPayment.amount <= 0
    ) {
      return jsonResponse({ error: "Razorpay payment is not valid or captured." }, 400);
    }

    // Confirm campaign ownership and the exact expected order amount.
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: attempt, error: attemptError } = await adminClient
      .from("campaign_payment_attempts")
      .select("id, campaign_id, brand_id, amount, payment_status, razorpay_order_id")
      .eq("campaign_id", campaignId)
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (attemptError || !attempt) {
      console.error("Payment attempt lookup failed:", attemptError?.message);
      return jsonResponse({ error: "Payment attempt not found." }, 404);
    }

    if (
      attempt.brand_id !== userData.user.id ||
      attempt.payment_status !== "created" ||
      attempt.razorpay_order_id !== orderId ||
      Math.round(Number(attempt.amount) * 100) !== razorpayPayment.amount
    ) {
      return jsonResponse({ error: "Payment does not match the campaign." }, 400);
    }

    // Confirm the campaign only after all server-side checks pass.
    const { data: confirmation, error: confirmationError } =
      await adminClient.rpc("confirm_campaign_razorpay_payment", {
        p_campaign_id: campaignId,
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
      });

    if (confirmationError || !confirmation?.success) {
      console.error(
        "Campaign payment confirmation failed:",
        confirmationError?.message,
      );

      return jsonResponse(
        { error: "Payment was verified but campaign confirmation failed. Contact AdSociety support." },
        500,
      );
    }

    return jsonResponse({
      success: true,
      campaign_id: campaignId,
      payment_id: paymentId,
      order_id: orderId,
      status: "confirmed",
      attempt_number: confirmation.attempt_number,
      confirmed_items: confirmation.confirmed_items,
    });
  } catch (error) {
    console.error(
      "Verify campaign payment error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      { error: "Unable to verify campaign payment." },
      500,
    );
  }
});