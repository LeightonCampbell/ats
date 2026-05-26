import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export type PayPalCheckoutProps = {
  paypalClientId: string;
  classTitle: string;
  classDate: string;
  meetingId: string;
  courseTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mailingAddress: string;
  session1Time?: string;
  session2Time?: string;
  onSuccess: (joinUrl: string) => void;
  onError: (message: string) => void;
};

export default function PayPalCheckout({
  paypalClientId,
  classTitle,
  classDate,
  meetingId,
  courseTitle,
  firstName,
  lastName,
  email,
  phone,
  mailingAddress,
  session1Time,
  session2Time,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
      <PayPalButtons
        style={{
          layout: "vertical",
          color: "blue",
          shape: "pill",
          label: "pay",
        }}
        createOrder={async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classTitle, classDate }),
          });
          const data = (await res.json()) as { id?: string };
          if (!data.id) throw new Error("Could not create order");
          return data.id;
        }}
        onApprove={async (data) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderID,
              meetingId,
              firstName,
              lastName,
              email,
              phone,
              mailingAddress,
              classTitle: courseTitle,
              classDate,
              session1_time: session1Time,
              session2_time: session2Time,
            }),
          });
          const result = (await res.json()) as {
            success?: boolean;
            joinUrl?: string;
            error?: string;
          };
          if (result.success) {
            onSuccess(result.joinUrl ?? "");
          } else {
            onError(result.error ?? "Something went wrong.");
          }
        }}
        onError={(err) => {
          console.error(err);
          onError("PayPal encountered an error. Please try again.");
        }}
      />
    </PayPalScriptProvider>
  );
}
