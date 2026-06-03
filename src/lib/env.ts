import { env as cfEnv } from "cloudflare:workers";

/** Cloudflare Workers env bindings, with import.meta.env fallback for local dev. */
export function getEnv(key: keyof RuntimeEnv): string {
  const fromCf = (cfEnv as Record<string, string | undefined>)[key];
  if (fromCf) return String(fromCf);

  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key];
  return fromMeta ? String(fromMeta) : "";
}

export function getZoomCredentials() {
  return {
    accountId: getEnv("ZOOM_ACCOUNT_ID"),
    clientId: getEnv("ZOOM_CLIENT_ID"),
    clientSecret: getEnv("ZOOM_CLIENT_SECRET"),
  };
}
