import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { registerForOccurrence } from "../../../lib/zoom";
import { sendReceiptEmail, sendAdminNotification } from "../../../lib/email";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env ?? {};
  if (env.STRIPE_SECRET_KEY) process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  if (env.ZOOM_ACCOUNT_ID) process.env.ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
  if (env.ZOOM_CLIENT_ID) process.env.ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
  if (env.ZOOM_CLIENT_SECRET) process.env.ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;
  const {
    paymentIntentId,
    firstName,
    lastName,
    email,
    phone,
    classTitle,
    classDate,
    session1_time,
    session2_time,
  } = await request.json();
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
      });
    }
    let joinUrl1 = "";
    let joinUrl2 = "";
    try {
      const zoom1 = await registerForOccurrence(session1_time, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      const zoom2 = await registerForOccurrence(session2_time, {
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
    await Promise.allSettled([
      sendReceiptEmail({
        to: email,
        name: firstName,
        classTitle,
        classDate,
        paypalOrderId: intent.id,
        zoomJoinUrl1: joinUrl1,
        zoomJoinUrl2: joinUrl2,
      }),
      sendAdminNotification({
        studentName: firstName + " " + lastName,
        studentEmail: email,
        studentPhone: phone,
        classTitle,
        classDate,
        paypalOrderId: intent.id,
      }),
    ]);
    return new Response(JSON.stringify({ success: true, joinUrl1, joinUrl2 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
