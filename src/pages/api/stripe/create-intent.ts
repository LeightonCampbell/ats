import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createPaymentIntent } from "../../../lib/stripe";

export const POST: APIRoute = async ({ request, locals }) => {
  if (env.STRIPE_SECRET_KEY) process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  const { classTitle, classDate } = await request.json();
  try {
    const intent = await createPaymentIntent(classTitle, classDate);
    return new Response(JSON.stringify({ clientSecret: intent.client_secret }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
