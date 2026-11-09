import type { APIRoute } from "astro";
import { getEnv, getZoomCredentials } from "../../lib/worker-env";
import { sendAdminNotification, sendReceiptEmail } from "../../lib/email";
import { retrievePaymentIntent, waitForPaymentIntentSucceeded } from "../../lib/stripe-api";
import {
  getUpcomingMeetings,
  getZoomToken,
  registerForOccurrence,
} from "../../lib/zoom";

const COURSE_TITLE = "Preventive Health & Safety Training";

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");

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
    let intent = await retrievePaymentIntent(stripeSecretKey, paymentIntentId);
    if (intent.status === "processing") {
      try {
        intent = await waitForPaymentIntentSucceeded(
          stripeSecretKey,
          paymentIntentId
        );
      } catch (pollErr: any) {
        return new Response(
          JSON.stringify({ error: pollErr.message ?? "Payment not completed" }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    if (intent.status !== "succeeded") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!session1_time || !session2_time) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid session times selected. Please go back and select your class again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const zoomCreds = getZoomCredentials();

    const validSessions = await getUpcomingMeetings(zoomCreds);
    const validTimes = new Set(validSessions.map((s: any) => s.start_time));
    if (!validTimes.has(session1_time) || !validTimes.has(session2_time)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid session times selected. Please go back and select your class again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let joinUrl1 = "";
    let joinUrl2 = "";

    try {
      const zoomToken = await getZoomToken(zoomCreds);
      const registrant = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      };

      const [zoom1, zoom2] = await Promise.allSettled([
        registerForOccurrence(zoomCreds, session1_time, registrant, zoomToken),
        registerForOccurrence(zoomCreds, session2_time, registrant, zoomToken),
      ]);

      if (zoom1.status === "fulfilled") joinUrl1 = zoom1.value.join_url;
      else console.error("Zoom session 1 failed:", zoom1.reason);

      if (zoom2.status === "fulfilled") joinUrl2 = zoom2.value.join_url;
      else console.error("Zoom session 2 failed:", zoom2.reason);
    } catch (zoomErr: any) {
      console.error("Zoom registration failed:", zoomErr.message);
    }

    const studentName = `${firstName} ${lastName}`.trim();
    try {
      await sendReceiptEmail({
        to: email,
        name: studentName || firstName || "Student",
        classTitle,
        classDate,
        paymentIntentId: intent.id,
        zoomJoinUrl1: joinUrl1,
        zoomJoinUrl2: joinUrl2,
      });
    } catch (mailErr: any) {
      console.error("Student confirmation email failed:", mailErr?.message ?? mailErr);
    }

    try {
      await sendAdminNotification({
        studentName: studentName || firstName || "Student",
        studentEmail: email,
        studentPhone: phone ?? "",
        mailingAddress: mailingAddress ?? "",
        classTitle,
        classDate,
        paymentIntentId: intent.id,
      });
    } catch (mailErr: any) {
      console.error("Admin enrollment email failed:", mailErr?.message ?? mailErr);
    }

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
