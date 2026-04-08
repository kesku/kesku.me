import type { Config } from "tailwindcss";

import plugin from "tailwindcss/plugin";

export default {
	content: ["./src/**/*.{astro,js,ts}"],
	corePlugins: {
		borderOpacity: false,
		fontVariantNumeric: false,
		ringOffsetColor: false,
		ringOffsetWidth: false,
		scrollSnapType: false,
		textOpacity: false,
		// disable some core plugins as they are included in the css, even when unused
		touchAction: false,
	},
	plugins: [
		plugin((api) => {
			api.addComponents({
				".title": {
					"@apply text-2xl font-semibold text-accent-2": {},
				},
			});
		}),
	],
	theme: {
		extend: {
			colors: {
				accent: "hsl(var(--theme-accent) / <alpha-value>)",
				"accent-2": "hsl(var(--theme-accent-2) / <alpha-value>)",
				bgColor: "hsl(var(--theme-bg) / <alpha-value>)",
				border: "hsl(var(--theme-border) / <alpha-value>)",
				muted: "hsl(var(--theme-muted) / <alpha-value>)",
				surface: "hsl(var(--theme-surface) / <alpha-value>)",
				"surface-2": "hsl(var(--theme-surface-2) / <alpha-value>)",
				textColor: "hsl(var(--theme-text) / <alpha-value>)",
			},
			transitionProperty: {
				height: "height",
			},
		},
	},
} satisfies Config;
