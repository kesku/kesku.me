import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkUnwrapImages from "remark-unwrap-images";

import { expressiveCodeOptions } from "./src/site.config";

// https://astro.build/config
export default defineConfig({
	image: {
		domains: ["webmention.io"],
	},
	integrations: [
		expressiveCode(expressiveCodeOptions),
		icon(),
		tailwind({
			applyBaseStyles: false,
			nesting: true,
		}),
		sitemap(),
		mdx(),
	],
	markdown: {
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{
					rel: ["nofollow", "noopener", "noreferrer"],
					target: "_blank",
				},
			],
		],
		remarkPlugins: [remarkUnwrapImages],
		remarkRehype: {
			footnoteLabelProperties: {
				className: [""],
			},
		},
	},
	output: "static",
	// https://docs.astro.build/en/guides/prefetch/
	prefetch: true,
	// ! Please remember to replace the following site property with your own domain
	site: "https://kesku.me",
	vite: {
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
	},
});
