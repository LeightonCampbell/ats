import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/worker-env";
import { createPaymentIntent } from "../../../lib/stripe-api";

const COURSE_AMOUNT_CENTS = 8000;

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { classTitle, classDate } = await request.json();

  try {
    const intent = await createPaymentIntent(
      stripeSecretKey,
      COURSE_AMOUNT_CENTS,
      classTitle,
      classDate
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
