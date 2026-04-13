import type { APIRoute } from "astro";

const SITE_URL = "https://www.alerttrainingservices.com";

const routes = [
  "/",
  "/preventative-health-and-safety-training",
  "/about-us",
  "/contact-us",
  "/class-rules",
  "/booking-success",
  "/ats-news",
];

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();

  const urls = routes
    .map(
      (route) => `<url>
  <loc>${new URL(route, SITE_URL).toString()}</loc>
  <lastmod>${now}</lastmod>
</url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
