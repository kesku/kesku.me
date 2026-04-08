import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
	author: "Kesku",
	description: "Kesku's personal site for random stuff",
	lang: "en",
	ogLocale: "en_GB",
	title: "Call me Kes!",
};

export const menuLinks: { path: string; title: string }[] = [
	{
		path: "/",
		title: "Home",
	},
	{
		path: "/about/",
		title: "About",
	},
	{
		path: "/projects/",
		title: "Projects",
	},
];
