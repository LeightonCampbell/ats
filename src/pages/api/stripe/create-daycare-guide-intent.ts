import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/worker-env";
import { createProductPaymentIntent } from "../../../lib/stripe-api";
import {
  DAYCARE_GUIDE_AMOUNT_CENTS,
  DAYCARE_GUIDE_PRODUCT_ID,
  DAYCARE_GUIDE_TITLE,
} from "../../../lib/daycare-guide";

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, firstName } = await request.json();

  if (!email || typeof email !== "string" || !email.trim()) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const intent = await createProductPaymentIntent(
      stripeSecretKey,
      DAYCARE_GUIDE_AMOUNT_CENTS,
      DAYCARE_GUIDE_TITLE,
      {
        productId: DAYCARE_GUIDE_PRODUCT_ID,
        email: email.trim(),
        firstName: typeof firstName === "string" ? firstName.trim() : "",
      }
    );
    return new Response(JSON.stringify({ clientSecret: intent.client_secret }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
