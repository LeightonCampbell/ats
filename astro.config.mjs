// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://www.alerttrainingservices.com",
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
});