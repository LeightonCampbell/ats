import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/worker-env";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      hasPublicKey: Boolean(getEnv("PUBLIC_STRIPE_PUBLISHABLE_KEY")),
      hasSecretKey: Boolean(getEnv("STRIPE_SECRET_KEY")),
      hasZoomAccountId: Boolean(getEnv("ZOOM_ACCOUNT_ID")),
      hasZoomClientId: Boolean(getEnv("ZOOM_CLIENT_ID")),
      hasZoomClientSecret: Boolean(getEnv("ZOOM_CLIENT_SECRET")),
      hasFormspreeFormId: Boolean(getEnv("FORMSPREE_FORM_ID")),
      hasFormspreeContactFormId: Boolean(getEnv("FORMSPREE_CONTACT_FORM_ID")),
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
