import type { APIRoute } from "astro";
import { createPayPalOrder } from "../../../lib/paypal";

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    classTitle?: string;
    classDate?: string;
  };
  const { classTitle, classDate } = body;

  if (!classTitle || !classDate) {
    return new Response(JSON.stringify({ error: "Missing class info" }), {
      status: 400,
    });
  }

  try {
    const order = await createPayPalOrder(classTitle, classDate);
    return new Response(JSON.stringify({ id: order.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
