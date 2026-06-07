import type { APIRoute } from "astro";
import { getEnv } from "../../lib/worker-env";
import { submitGuidePurchaseToFormspree } from "../../lib/formspree";
import {
  retrievePaymentIntent,
  waitForPaymentIntentSucceeded,
} from "../../lib/stripe-api";
import {
  DAYCARE_GUIDE_AMOUNT_CENTS,
  DAYCARE_GUIDE_DOWNLOADS,
  DAYCARE_GUIDE_PRODUCT_ID,
  DAYCARE_GUIDE_TITLE,
} from "../../lib/daycare-guide";

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { paymentIntentId, email, firstName } = await request.json();

  if (!paymentIntentId || !email) {
    return new Response(
      JSON.stringify({ error: "Payment and email are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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

    const metadata = intent.metadata ?? {};
    if (metadata.productId !== DAYCARE_GUIDE_PRODUCT_ID) {
      return new Response(JSON.stringify({ error: "Invalid product" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent.amount !== undefined && intent.amount !== DAYCARE_GUIDE_AMOUNT_CENTS) {
      return new Response(JSON.stringify({ error: "Invalid payment amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formspreeFormId = getEnv("FORMSPREE_FORM_ID");
    if (formspreeFormId) {
      try {
        await submitGuidePurchaseToFormspree(formspreeFormId, {
          email: String(email).trim(),
          firstName: typeof firstName === "string" ? firstName.trim() : "",
          paymentIntentId,
          productTitle: DAYCARE_GUIDE_TITLE,
        });
      } catch (err) {
        console.error("Formspree guide purchase notification failed:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        downloads: {
          guide: DAYCARE_GUIDE_DOWNLOADS.guide,
          checklist: DAYCARE_GUIDE_DOWNLOADS.checklist,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
