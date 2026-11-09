import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/worker-env";

export const GET: APIRoute = async () => {
  const pub = getEnv("PUBLIC_STRIPE_PUBLISHABLE_KEY");
  const secret = getEnv("STRIPE_SECRET_KEY");
  const pubMode = pub.startsWith("pk_live")
    ? "live"
    : pub.startsWith("pk_test")
      ? "test"
      : pub
        ? "unknown"
        : "missing";
  const secretMode = secret.startsWith("sk_live")
    ? "live"
    : secret.startsWith("sk_test")
      ? "test"
      : secret
        ? "unknown"
        : "missing";

  return new Response(
    JSON.stringify({
      hasPublicKey: Boolean(pub),
      hasSecretKey: Boolean(secret),
      stripePublishableMode: pubMode,
      stripeSecretMode: secretMode,
      stripeModesMatch:
        pubMode !== "missing" &&
        secretMode !== "missing" &&
        pubMode === secretMode,
      hasZoomAccountId: Boolean(getEnv("ZOOM_ACCOUNT_ID")),
      hasZoomClientId: Boolean(getEnv("ZOOM_CLIENT_ID")),
      hasZoomClientSecret: Boolean(getEnv("ZOOM_CLIENT_SECRET")),
      hasResendApiKey: Boolean(getEnv("RESEND_API_KEY")),
      hasFromEmail: Boolean(getEnv("FROM_EMAIL")),
      hasAdminEmail: Boolean(getEnv("ADMIN_EMAIL")),
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
