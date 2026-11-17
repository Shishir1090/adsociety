
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

    if (
      typeof campaignId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        campaignId,
      )
    ) {
      return jsonResponse({ error: "Valid campaign_id is required." }, 400);
    }

    // Prepare payment using the authenticated Brand's permissions.
    const { data: paymentData, error: prepareError } =
      await userClient.rpc("brand_prepare_campaign_payment", {
        p_campaign_id: campaignId,
      });

    if (prepareError) {
      console.error("Payment preparation failed:", prepareError.message);
      return jsonResponse(
        { error: "Campaign payment could not be prepared." },
        400,
      );
    }

    if (
      !paymentData ||
      paymentData.success !== true ||
      paymentData.currency !== "INR"
    ) {
      return jsonResponse({ error: "Invalid payment details." }, 400);
    }

    const totalPayable = Number(paymentData.total_payable);
    const amountInPaise = Math.round(totalPayable * 100);

    if (
      !Number.isFinite(totalPayable) ||
      totalPayable <= 0 ||
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return jsonResponse({ error: "Invalid payment amount." }, 400);
    }

    // Create Razorpay order using server-side credentials.
    const receipt = `camp_${campaignId.replaceAll("-", "").slice(0, 20)}_${crypto.randomUUID().slice(0, 8)}`;

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${razorpayKeyId}:${razorpayKeySecret}`,
          )}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            campaign_id: campaignId,
            brand_id: userData.user.id,
          },
        }),
      },
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay order creation failed:", razorpayData);
      return jsonResponse(
        { error: "Razorpay order creation failed." },
        502,
      );
    }

    if (
      !razorpayData.id ||
      razorpayData.amount !== amountInPaise ||
      razorpayData.currency !== "INR"
    ) {
      return jsonResponse(
        { error: "Razorpay returned an invalid order." },
        502,
      );
    }

    // Register the order using the server-side Service Role client.
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

    const { data: attemptData, error: attemptError } =
      await adminClient.rpc("register_campaign_payment_attempt", {
        p_campaign_id: campaignId,
        p_razorpay_order_id: razorpayData.id,
      });

    if (attemptError || !attemptData?.success) {
      console.error(
        "Payment attempt registration failed:",
        attemptError?.message,
      );

      return jsonResponse(
        { error: "Could not register the payment attempt." },
        500,
      );
    }

    if (
      Number(attemptData.amount) !== totalPayable ||
      attemptData.currency !== "INR"
    ) {
      return jsonResponse(
        { error: "Registered payment amount mismatch." },
        500,
      );
    }

    return jsonResponse({
      success: true,
      campaign_id: campaignId,
      payment_id: attemptData.attempt_id,
      attempt_number: attemptData.attempt_number,
      razorpay_order_id: razorpayData.id,
      amount: razorpayData.amount,
      currency: razorpayData.currency,
      key_id: razorpayKeyId,
      brand_name: "AdSociety",
    });
  } catch (error) {
    console.error(
      "Create campaign payment error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      { error: "Unable to create campaign payment." },
      500,
    );
  }
});
