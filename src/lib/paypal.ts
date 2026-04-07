const PAYPAL_BASE =
  import.meta.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function encodeBasic(user: string, pass: string): string {
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

// Fetches a PayPal OAuth token
export async function getPayPalToken(): Promise<string> {
  const credentials = encodeBasic(
    import.meta.env.PAYPAL_CLIENT_ID ?? "",
    import.meta.env.PAYPAL_CLIENT_SECRET ?? ""
  );
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token error: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Creates a PayPal order for $80
export async function createPayPalOrder(
  classTitle: string,
  classDate: string
): Promise<{ id: string }> {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `${classTitle} — ${classDate}`,
          amount: {
            currency_code: "USD",
            value: "80.00",
            breakdown: {
              item_total: { currency_code: "USD", value: "80.00" },
            },
          },
          items: [
            {
              name: classTitle,
              description: `Class date: ${classDate}`,
              quantity: "1",
              unit_amount: { currency_code: "USD", value: "80.00" },
              category: "DIGITAL_GOODS",
            },
          ],
        },
      ],
      application_context: {
        brand_name: "Alert Training Services",
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!res.ok)
    throw new Error(`PayPal create order error: ${await res.text()}`);
  return (await res.json()) as { id: string };
}

// Captures an approved PayPal order — this is when money moves
export async function capturePayPalOrder(orderId: string): Promise<unknown> {
  const token = await getPayPalToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`PayPal capture error: ${await res.text()}`);
  return await res.json();
}
