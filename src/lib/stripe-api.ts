const STRIPE_API = "https://api.stripe.com/v1";

export type PaymentIntentResult = {
  id: string;
  client_secret: string;
  status: string;
  amount?: number;
  metadata?: Record<string, string>;
};

function stripeHeaders(secretKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export type PaymentCustomerDetails = {
  email: string;
  name?: string;
  phone?: string;
};

/** Create a PaymentIntent via Stripe REST API (no Node SDK). */
export async function createPaymentIntent(
  secretKey: string,
  amountCents: number,
  classTitle: string,
  classDate: string,
  customer?: PaymentCustomerDetails
): Promise<PaymentIntentResult> {
  const body = new URLSearchParams({
    amount: String(amountCents),
    currency: "usd",
    description: classTitle,
    "payment_method_types[]": "card",
    "metadata[classTitle]": classTitle,
    "metadata[classDate]": classDate,
  });

  applyCustomerToPaymentIntent(body, customer);

  return createPaymentIntentRequest(secretKey, body);
}

/** Create a PaymentIntent for a digital product (e.g. daycare guide bundle). */
export async function createProductPaymentIntent(
  secretKey: string,
  amountCents: number,
  description: string,
  metadata: Record<string, string> = {},
  customer?: PaymentCustomerDetails
): Promise<PaymentIntentResult> {
  const body = new URLSearchParams({
    amount: String(amountCents),
    currency: "usd",
    description,
    "payment_method_types[]": "card",
  });

  for (const [key, value] of Object.entries(metadata)) {
    body.set(`metadata[${key}]`, value);
  }

  applyCustomerToPaymentIntent(body, customer);

  return createPaymentIntentRequest(secretKey, body);
}

/** Attach email/name so Stripe Dashboard + automatic receipts work. */
function applyCustomerToPaymentIntent(
  body: URLSearchParams,
  customer?: PaymentCustomerDetails
): void {
  if (!customer?.email) return;

  const email = customer.email.trim();
  body.set("receipt_email", email);
  body.set("metadata[customerEmail]", email);

  if (customer.name?.trim()) {
    body.set("metadata[customerName]", customer.name.trim());
  }
  if (customer.phone?.trim()) {
    body.set("metadata[customerPhone]", customer.phone.trim());
  }
}

async function createPaymentIntentRequest(
  secretKey: string,
  body: URLSearchParams
): Promise<PaymentIntentResult> {
  const res = await fetch(`${STRIPE_API}/payment_intents`, {
    method: "POST",
    headers: stripeHeaders(secretKey),
    body,
  });

  if (!res.ok) {
    throw new Error(`Stripe create intent error: ${await res.text()}`);
  }

  return (await res.json()) as PaymentIntentResult;
}

/** Retrieve a PaymentIntent to verify payment status. */
export async function retrievePaymentIntent(
  secretKey: string,
  paymentIntentId: string
): Promise<PaymentIntentResult> {
  const res = await fetch(
    `${STRIPE_API}/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  if (!res.ok) {
    throw new Error(`Stripe retrieve intent error: ${await res.text()}`);
  }

  return (await res.json()) as PaymentIntentResult;
}

const ENROLLABLE_STATUSES = new Set(["succeeded", "processing"]);

/** Poll until PaymentIntent succeeds (handles async card processing). */
export async function waitForPaymentIntentSucceeded(
  secretKey: string,
  paymentIntentId: string,
  opts?: { maxAttempts?: number; delayMs?: number }
): Promise<PaymentIntentResult> {
  const maxAttempts = opts?.maxAttempts ?? 10;
  const delayMs = opts?.delayMs ?? 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const intent = await retrievePaymentIntent(secretKey, paymentIntentId);
    if (intent.status === "succeeded") return intent;
    if (!ENROLLABLE_STATUSES.has(intent.status)) {
      throw new Error(`Payment status: ${intent.status}`);
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Payment still processing");
}
