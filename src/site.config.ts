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

export const socialLinks: {
	extra?: string;
	friendlyName: string;
	icon: string;
	link: string;
}[] = [
	{
		friendlyName: "GitHub",
		icon: "mdi:github",
		link: "https://github.com/kesku",
	},
	{
		friendlyName: "Twitter",
		icon: "mdi:twitter",
		link: "https://x.com/yoimnotkesku",
	},
	{
		friendlyName: "Discord",
		icon: "mdi:discord",
		link: "https://discordapp.com/users/539468067923820546",
	},
	{
		extra: "admin@kesku.me",
		friendlyName: "Email",
		icon: "mdi:email",
		link: "mailto:admin@kesku.me",
	},
];
