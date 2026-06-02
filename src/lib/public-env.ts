/**
 * Stripe publishable key for the browser SDK.
 * PUBLIC_* vars are inlined at build time; on production hosts we also read
 * process.env at request time so runtime env config works without a rebuild.
 */
export function getPublicStripePublishableKey(): string {
  const fromMeta = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const fromRuntime =
    typeof process !== "undefined"
      ? process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
      : "";

  return (fromMeta || fromRuntime).trim();
}
