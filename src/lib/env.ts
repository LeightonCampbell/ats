/** Safe env access from .env / import.meta.env (works in local dev and Astro pages). */
export function getEnv(key: keyof RuntimeEnv): string {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key];
  return fromMeta ? String(fromMeta) : "";
}

/** Astro SSR pages — use Cloudflare runtime env when build-time PUBLIC_ vars are missing. */
export async function getEnvAtRuntime(key: keyof RuntimeEnv): Promise<string> {
  const fromMeta = getEnv(key);
  if (fromMeta) return fromMeta;

  if (import.meta.env.DEV) return "";

  try {
    const { env } = await import("cloudflare:workers");
    const fromCf = (env as Record<string, string | undefined>)[key];
    return fromCf ? String(fromCf).trim() : "";
  } catch {
    return "";
  }
}

export function getZoomCredentials() {
  return {
    accountId: getEnv("ZOOM_ACCOUNT_ID"),
    clientId: getEnv("ZOOM_CLIENT_ID"),
    clientSecret: getEnv("ZOOM_CLIENT_SECRET"),
  };
}
