import { useState, useEffect, useRef } from "react";
import type { CSSProperties, FormEvent } from "react";

type StripeCardElement = {
  mount: (el: string | HTMLElement) => void;
  unmount: () => void;
  on: (
    event: "change",
    handler: (event: { error?: { message?: string } }) => void
  ) => void;
  off: (
    event: "change",
    handler: (event: { error?: { message?: string } }) => void
  ) => void;
};

type StripeInstance = {
  elements: () => { create: (type: string) => StripeCardElement };
  confirmCardPayment: (
    secret: string,
    data: { payment_method: { card: StripeCardElement } }
  ) => Promise<{
    error?: { message?: string };
    paymentIntent?: { id: string; status: string };
  }>;
  retrievePaymentIntent: (clientSecret: string) => Promise<{
    paymentIntent?: { id: string; status: string };
  }>;
};

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}

type DownloadLinks = {
  guide: string;
  checklist: string;
};

async function waitForPaymentSucceeded(
  stripe: StripeInstance,
  clientSecret: string
): Promise<{ id: string; status: string }> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    if (paymentIntent?.status === "succeeded") return paymentIntent;
    if (paymentIntent?.status !== "processing") {
      throw new Error(`Payment status: ${paymentIntent?.status ?? "unknown"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Payment still processing");
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#1b3a5c",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 15,
  marginBottom: 16,
  boxSizing: "border-box",
};

const cardWrapStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  marginBottom: 16,
  background: "white",
};

const btnStyle: CSSProperties = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: 999,
  border: "none",
  background: "#e02b2b",
  color: "white",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};

export default function DaycareGuideCheckout({
  publishableKey,
}: {
  publishableKey: string;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const [downloads, setDownloads] = useState<DownloadLinks | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);

  useEffect(() => {
    if (window.Stripe) {
      setStripeReady(true);
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (window.Stripe) {
        setStripeReady(true);
        window.clearInterval(intervalId);
      } else if (attempts >= 75) {
        window.clearInterval(intervalId);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!stripeReady || !publishableKey || !cardRef.current || downloads) {
      return;
    }

    const stripe = window.Stripe!(publishableKey);
    stripeRef.current = stripe;
    const card = stripe.elements().create("card");
    card.mount(cardRef.current);
    cardElementRef.current = card;

    const onCardChange = (event: { error?: { message?: string } }) => {
      if (event.error?.message) {
        setPaymentError(event.error.message);
      } else {
        setPaymentError("");
      }
    };
    card.on("change", onCardChange);

    return () => {
      card.off("change", onCardChange);
      card.unmount();
      cardElementRef.current = null;
      stripeRef.current = null;
    };
  }, [stripeReady, publishableKey, downloads]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (!email.trim()) {
      setPaymentError("Please enter your email address.");
      return;
    }

    if (!stripeReady || !window.Stripe) {
      setPaymentError(
        "Payment form could not load. Disable ad blockers for this site and refresh."
      );
      return;
    }

    if (!stripeRef.current || !cardElementRef.current) {
      setPaymentError("Payment form is not ready. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      const intentRes = await fetch("/api/stripe/create-daycare-guide-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), firstName: firstName.trim() }),
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.clientSecret) {
        setPaymentError(intentData.error ?? "Could not start payment.");
        return;
      }

      const { error, paymentIntent } =
        await stripeRef.current.confirmCardPayment(intentData.clientSecret, {
          payment_method: { card: cardElementRef.current },
        });

      if (error) {
        setPaymentError(
          error.message ?? "Please enter your card details to continue."
        );
        return;
      }

      if (!paymentIntent?.id) {
        setPaymentError("Payment could not be started. Please try again.");
        return;
      }

      let confirmedIntent = paymentIntent;
      if (paymentIntent.status === "processing") {
        confirmedIntent = await waitForPaymentSucceeded(
          stripeRef.current,
          intentData.clientSecret
        );
      } else if (paymentIntent.status !== "succeeded") {
        setPaymentError(`Payment status: ${paymentIntent.status}`);
        return;
      }

      const fulfillRes = await fetch("/api/fulfill-daycare-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: confirmedIntent.id,
          email: email.trim(),
          firstName: firstName.trim(),
        }),
      });

      const fulfillData = await fulfillRes.json();
      if (!fulfillRes.ok || !fulfillData.success) {
        setPaymentError(
          fulfillData.error ??
            "Payment succeeded but downloads could not be delivered. Email info@alerttrainingservices.com with your receipt."
        );
        return;
      }

      setDownloads(fulfillData.downloads);
    } catch {
      setPaymentError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (downloads) {
    return (
      <div
        style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            color: "#1b3a5c",
            margin: "0 0 10px",
          }}
        >
          Thank you — your download is ready
        </h3>
        <p style={{ color: "#515154", lineHeight: 1.6, marginBottom: 20 }}>
          We also sent a copy to <strong>{email}</strong>. Save these links for
          future access.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <a
            href={downloads.guide}
            download
            style={{
              display: "block",
              textAlign: "center",
              background: "#1b3a5c",
              color: "white",
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            Download startup guide (PDF)
          </a>
          <a
            href={downloads.checklist}
            download
            style={{
              display: "block",
              textAlign: "center",
              background: "#eef2f7",
              color: "#1b3a5c",
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            Download checklist (PDF)
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 700, color: "#1b3a5c" }}>
        $29 — instant download
      </div>
      <label style={labelStyle}>First name</label>
      <input
        style={inputStyle}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Optional"
        autoComplete="given-name"
      />
      <label style={labelStyle}>Email *</label>
      <input
        style={inputStyle}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <label style={labelStyle}>Card details *</label>
      <div ref={cardRef} style={cardWrapStyle} />
      {paymentError && (
        <p style={{ color: "#b42318", fontSize: 13, marginTop: -8, marginBottom: 12 }}>
          {paymentError}
        </p>
      )}
      <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Processing…" : "Purchase & download — $29"}
      </button>
      <p style={{ fontSize: 12, color: "#86868b", marginTop: 12, marginBottom: 0 }}>
        Secure payment via Stripe. PDF files delivered immediately after purchase.
      </p>
    </form>
  );
}
