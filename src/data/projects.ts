import type { Project } from "@/utils/github";

export const projectRepos: string[] = [
	"perplexityai/modelcontextprotocol",
	"kesku/shinpo",
	"texstudio-org/texstudio",
	"perplexityai/perplexity-py",
	"perplexityai/perplexity-node",
	"kesku/kesku.me",
	"perplexityai/api-cookbook",
	"openai/openai-cookbook",
	"vercel/ai",
	"langchain-ai/langchain",
];

export const projectOverrides: Record<string, Partial<Project>> = {
	"kesku/kesku.me": {
		customDescription: "This website you're looking at right now!",
		featured: true,
	},
	"kesku/Shinpo": {
		customDescription:
			"I got bored and made an unofficial client NHK Easy News, it barely works but I had fun making it",
	},
	"langchain-ai/langchain": {
		customDescription: "A cool framework for building agents",
		customName: "langchain-ai/langchain",
	},
	"perplexityai/api-cookbook": {
		customDescription:
			"A cookbook for the Perplexity API, everything here gets featured on our docs",
	},
	"perplexityai/modelcontextprotocol": {
		customDescription: "The official MCP Server for Perplexity's API, which I own and maintain",
		featured: true,
	},
	"perplexityai/perplexity-node": {
		customDescription: "The official JS/TS client for Perplexity's API, built with Stainless",
	},
	"perplexityai/perplexity-py": {
		customDescription: "The official Python client for Perplexity's API, built with Stainless",
	},
	"texstudio-org/texstudio": {
		customDescription: "A pretty cool LaTeX editor written in C++",
	},
	"vercel/ai": {
		customDescription: "The official AI SDK by Vercel for TypeScript",
		customName: "vercel/ai",
	},
};
