import Stripe from "stripe";

export const getStripe = () =>
  new Stripe(process.env.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

export async function createPaymentIntent(classTitle: string, classDate: string) {
  return await getStripe().paymentIntents.create({
    amount: 6500,
    currency: "usd",
    metadata: { classTitle, classDate },
    description: classTitle,
  });
}
