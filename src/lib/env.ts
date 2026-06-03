/** Safe env access from .env / import.meta.env (works in local dev and Astro pages). */
export function getEnv(key: keyof RuntimeEnv): string {
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
