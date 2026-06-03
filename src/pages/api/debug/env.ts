import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals } = context;
  const runtime = locals.runtime?.env;

  const publicKey =
    runtime?.PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";
  const secretKey =
    runtime?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY || "";
  const zoomAccount =
    runtime?.ZOOM_ACCOUNT_ID || import.meta.env.ZOOM_ACCOUNT_ID || "";
  const formspree =
    runtime?.FORMSPREE_FORM_ID || import.meta.env.FORMSPREE_FORM_ID || "";

  return new Response(
    JSON.stringify({
      hasPublicKey: Boolean(publicKey),
      hasSecretKey: Boolean(secretKey),
      hasZoomAccountId: Boolean(zoomAccount),
      hasFormspreeFormId: Boolean(formspree),
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
