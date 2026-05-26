/**
 * PayPal client ID for the browser SDK.
 * PUBLIC_* vars are inlined at build time; on production hosts we also read
 * process.env at request time so runtime env config works without a rebuild.
 */
export function getPublicPayPalClientId(): string {
  const fromMeta = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const fromRuntime =
    typeof process !== "undefined"
      ? (process.env.PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID ?? "")
      : "";

  return (fromMeta || fromRuntime).trim();
}
