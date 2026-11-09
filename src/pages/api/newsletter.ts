import type { APIRoute } from "astro";
import {
  sendNewsletterConfirmation,
  sendNewsletterSignupToAdmin,
} from "../../lib/email";
import { getEnv } from "../../lib/worker-env";

export const POST: APIRoute = async ({ request }) => {
  if (!getEnv("RESEND_API_KEY") || !getEnv("FROM_EMAIL") || !getEnv("ADMIN_EMAIL")) {
    return new Response(JSON.stringify({ error: "Newsletter is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const website = String(body.website ?? "").trim(); // honeypot

  if (website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "A valid email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await sendNewsletterSignupToAdmin({ email });
    try {
      await sendNewsletterConfirmation({ email });
    } catch (err: any) {
      console.error("Newsletter confirmation failed:", err?.message ?? err);
    }
    return new Response(JSON.stringify({ ok: true }), {
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
