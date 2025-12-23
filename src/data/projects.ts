import type { Project } from "@/utils/github";

export const projectRepos: string[] = [
	"perplexityai/modelcontextprotocol",
	"kesku/shinpo",
	"texstudio-org/texstudio",
	"perplexityai/perplexity-py",
	"perplexityai/perplexity-node",
	"kesku/kesku.me",
];

export const projectOverrides: Record<string, Partial<Project>> = {
	"perplexityai/modelcontextprotocol": {
		customDescription: "The official MCP Server for Perplexity's API, which I own and maintain. ",
		featured: true,
	},
	"kesku/Shinpo": {
		customDescription:
			"I got bored and made an unofficial client NHK Easy News, it barely works but I had fun making it!",
	},
	"texstudio-org/texstudio": {
		customDescription: "A pretty cool LaTeX editor written in C++.",
	},
	"perplexityai/perplexity-py": {
		customDescription: "The official Python client for Perplexity's API, built with Stainless!",
	},
	"perplexityai/perplexity-node": {
		customDescription: "The official JS/TS client for Perplexity's API, built with Stainless!",
	},
	"kesku/kesku.me": {
		customDescription: "This website you're looking at right now!",
		featured: true,
	},
};
