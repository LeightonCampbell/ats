import type { APIContext } from "astro";
import type { ZoomCredentials } from "./zoom";

/** Cloudflare Pages bindings, with import.meta.env fallback for local dev. */
export function getEnv(
  locals: APIContext["locals"] | App.Locals,
  key: keyof RuntimeEnv
): string {
  const runtime = (locals as App.Locals)?.runtime?.env;
  const fromRuntime = runtime?.[key];
  if (fromRuntime) return String(fromRuntime);

  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key];
  return fromMeta ? String(fromMeta) : "";
}

export function getZoomCredentials(
  locals: APIContext["locals"] | App.Locals
): ZoomCredentials {
  return {
    accountId: getEnv(locals, "ZOOM_ACCOUNT_ID"),
    clientId: getEnv(locals, "ZOOM_CLIENT_ID"),
    clientSecret: getEnv(locals, "ZOOM_CLIENT_SECRET"),
  };
}
