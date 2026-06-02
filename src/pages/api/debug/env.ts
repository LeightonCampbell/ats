import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const publicKey =
    process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    "";
  const secretKey =
    process.env.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY ?? "";

  return new Response(
    JSON.stringify({
      hasPublicKey: Boolean(publicKey),
      hasSecretKey: Boolean(secretKey),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
};
