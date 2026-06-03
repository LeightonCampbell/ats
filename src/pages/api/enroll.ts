import type { APIRoute } from "astro";
import { getEnv, getZoomCredentials } from "../../lib/env";
import { submitEnrollmentToFormspree } from "../../lib/formspree";
import { retrievePaymentIntent } from "../../lib/stripe-api";
import { registerForOccurrence } from "../../lib/zoom";

const COURSE_TITLE = "Preventive Health & Safety Training";

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const stripeSecretKey =
    locals.runtime?.env?.STRIPE_SECRET_KEY ||
    import.meta.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const {
    paymentIntentId,
    firstName,
    lastName,
    email,
    phone,
    mailingAddress,
    classTitle = COURSE_TITLE,
    classDate,
    session1_time,
    session2_time,
  } = body;

  try {
    const intent = await retrievePaymentIntent(stripeSecretKey, paymentIntentId);
    if (intent.status !== "succeeded") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
        headers: { "Content-Type": "application/json" },
      });
    }

    const zoomCreds = getZoomCredentials(locals);
    let joinUrl1 = "";
    let joinUrl2 = "";

    try {
      const zoom1 = await registerForOccurrence(zoomCreds, session1_time, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      const zoom2 = await registerForOccurrence(zoomCreds, session2_time, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      joinUrl1 = zoom1.join_url;
      joinUrl2 = zoom2.join_url;
    } catch (zoomErr: any) {
      console.error("Zoom registration failed:", zoomErr.message);
    }

    const formspreeFormId = getEnv(locals, "FORMSPREE_FORM_ID");
    await submitEnrollmentToFormspree(formspreeFormId, {
      firstName,
      lastName,
      email,
      phone,
      mailingAddress,
      classTitle,
      classDate,
      paymentIntentId: intent.id,
      zoomJoinUrl1: joinUrl1,
      zoomJoinUrl2: joinUrl2,
    });

    return new Response(
      JSON.stringify({ success: true, joinUrl1, joinUrl2 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
