import { env as cfEnv } from "cloudflare:workers";
import { getEnv as getMetaEnv } from "./env";

/** Cloudflare runtime bindings with .env fallback — use in API routes only. */
export function getEnv(key: keyof RuntimeEnv): string {
  const fromCf = (cfEnv as Record<string, string | undefined>)[key];
  if (fromCf) return String(fromCf);

  return getMetaEnv(key);
}

export function getZoomCredentials() {
  return {
    accountId: getEnv("ZOOM_ACCOUNT_ID"),
    clientId: getEnv("ZOOM_CLIENT_ID"),
    clientSecret: getEnv("ZOOM_CLIENT_SECRET"),
  };
}
