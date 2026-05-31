// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	site: "https://voimalyhty.fi",
	output: "static",
	devToolbar: {
		enabled: false,
	},
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
