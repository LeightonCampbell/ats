import type { APIRoute } from "astro";
import { submitContactToFormspree } from "../../lib/formspree";
import { getEnv } from "../../lib/worker-env";

export const POST: APIRoute = async ({ request }) => {
  const formId = getEnv("FORMSPREE_CONTACT_FORM_ID");

  if (!formId) {
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

  if (!fullName || !email || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await submitContactToFormspree(formId, { fullName, email, phone, message });
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
