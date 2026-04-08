import type { APIRoute } from "astro";
import { capturePayPalOrder } from "../../../lib/paypal";
import { registerForOccurrence } from "../../../lib/zoom";
import { sendReceiptEmail, sendAdminNotification } from "../../../lib/email";
import { submitHubSpotBookingForm } from "../../../lib/hubspot";

type CaptureBody = {
  orderId?: string;
  meetingId?: string;
  session1_time?: string;
  session2_time?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mailingAddress?: string;
  classTitle?: string;
  classDate?: string;
};

function isCompletedCapture(capture: unknown): boolean {
  const c = capture as {
    purchase_units?: Array<{
      payments?: { captures?: Array<{ status?: string }> };
    }>;
  };
  const status = c?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
  return status === "COMPLETED";
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as CaptureBody;
  const {
    orderId,
    meetingId,
    session1_time,
    session2_time,
    firstName,
    lastName,
    email,
    phone,
    mailingAddress,
    classTitle,
    classDate,
  } = body;

  if (!orderId || !meetingId || !firstName || !lastName || !email) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  if (!session1_time || !session2_time) {
    return new Response(JSON.stringify({ error: "Missing session times" }), {
      status: 400,
    });
  }

  try {
    const capture = await capturePayPalOrder(orderId);

    if (!isCompletedCapture(capture)) {
      return new Response(
        JSON.stringify({ error: "Payment not completed", details: capture }),
        { status: 402 }
      );
    }

    let zoom1: { join_url: string; registrant_id: string } | undefined;
    let zoom2: { join_url: string; registrant_id: string } | undefined;
    try {
      // Expect these in the request body from the widget:
      // session1_time, session2_time (ISO strings)

      zoom1 = await registerForOccurrence(session1_time, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
      });

      zoom2 = await registerForOccurrence(session2_time, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
      });
    } catch (zoomErr: unknown) {
      const msg =
        zoomErr instanceof Error ? zoomErr.message : String(zoomErr);
      console.error("Zoom registration failed:", msg);
    }

    const studentFullName = `${firstName} ${lastName}`;
    const joinUrl1 = zoom1?.join_url ?? "https://zoom.us";
    const joinUrl2 = zoom2?.join_url ?? joinUrl1;
    const joinUrl = joinUrl1;
    const flowStatus = zoom1 && zoom2 ? "zoom_registered" : "zoom_failed";

    await Promise.allSettled([
      sendReceiptEmail({
        to: email,
        name: studentFullName,
        classTitle: classTitle ?? "",
        classDate: classDate ?? "",
        paypalOrderId: orderId,
        zoomJoinUrl1: joinUrl1,
        zoomJoinUrl2: joinUrl2,
      }),
      sendAdminNotification({
        studentName: studentFullName,
        studentEmail: email,
        studentPhone: phone || "",
        classTitle: classTitle ?? "",
        classDate: classDate ?? "",
        paypalOrderId: orderId,
      }),
      submitHubSpotBookingForm({
        submissionDateIso: new Date().toISOString(),
        chosenClass: classTitle ?? "",
        classSessionLabel: classDate ?? "",
        firstName,
        lastName,
        email,
        phone: phone || "",
        mailingAddress: mailingAddress || "",
        paypalOrderId: orderId,
        zoomSession1Time: session1_time,
        zoomSession2Time: session2_time,
        zoomJoinUrl1: joinUrl1,
        zoomJoinUrl2: joinUrl2,
        flowStatus,
      }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        joinUrl,
        paypalOrderId: orderId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error(
      "Capture error:",
      err instanceof Error ? err.message : err
    );
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
