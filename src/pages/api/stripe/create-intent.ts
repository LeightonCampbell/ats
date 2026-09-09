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

  const { classTitle, classDate, email, firstName, lastName, phone } =
    await request.json();

  if (!email || typeof email !== "string" || !email.trim()) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = [firstName, lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part: string) => part.trim())
    .join(" ");

  try {
    const intent = await createPaymentIntent(
      stripeSecretKey,
      COURSE_AMOUNT_CENTS,
      classTitle,
      classDate,
      {
        email: email.trim(),
        name: name || undefined,
        phone: typeof phone === "string" ? phone.trim() : undefined,
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
