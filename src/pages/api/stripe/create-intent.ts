import type { APIRoute } from "astro";
import { createPaymentIntent } from "../../../lib/stripe";

export const POST: APIRoute = async ({ request }) => {
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
