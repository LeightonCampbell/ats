import type { APIRoute } from "astro";
import { sendInquiryAutoReply, sendInquiryToAdmin } from "../../lib/email";
import { getEnv } from "../../lib/worker-env";

export const POST: APIRoute = async ({ request }) => {
  if (!getEnv("RESEND_API_KEY") || !getEnv("FROM_EMAIL") || !getEnv("ADMIN_EMAIL")) {
    return new Response(JSON.stringify({ error: "Contact form is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const website = String(body.website ?? "").trim(); // honeypot
  const subject = String(body.subject ?? "Contact form inquiry").trim() || "Contact form inquiry";

  // Bot filled the hidden field
  if (website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!fullName || !email || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await sendInquiryToAdmin({
      fullName,
      email,
      phone,
      message,
      subject,
    });

    try {
      await sendInquiryAutoReply({ to: email, fullName });
    } catch (autoReplyErr: any) {
      console.error("Inquiry auto-reply failed:", autoReplyErr?.message ?? autoReplyErr);
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
