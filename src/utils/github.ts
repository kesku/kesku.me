export interface GitHubRepo {
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	homepage: string | null;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	updated_at: string;
	topics: string[];
	archived: boolean;
	fork: boolean;
}

export interface Project extends GitHubRepo {
	customDescription?: string;
	featured?: boolean;
}

const GITHUB_API_BASE = "https://api.github.com";

export async function fetchRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
	const token = import.meta.env.GITHUB_TOKEN;
	const baseHeaders: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "kesku.me",
	};

	if (token) {
		try {
			const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
				headers: { ...baseHeaders, Authorization: `token ${token}` },
			});

			if (response.ok) return await response.json();
			if (response.status !== 403) return null;
		} catch {
			return null;
		}
	}

	try {
		const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
			headers: baseHeaders,
		});
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}

export async function fetchRepos(repoNames: string[]): Promise<GitHubRepo[]> {
	const repos = await Promise.all(
		repoNames.map(async (fullName) => {
			const [owner, repo] = fullName.split("/");
			return fetchRepo(owner, repo);
		}),
	);

	return repos.filter((repo): repo is GitHubRepo => repo !== null);
}

export function normalizeRepoName(repoName: string, defaultOwner: string = "kesku"): string {
	if (repoName.includes("/")) {
		return repoName;
	}
	return `${defaultOwner}/${repoName}`;
}

export function mergeProjectData(
	repos: GitHubRepo[],
	overrides: Record<string, Partial<Project>>,
): Project[] {
	return repos.map((repo) => {
		const override = overrides[repo.full_name] || overrides[repo.name] || {};
		return {
			...repo,
			description: override.customDescription || repo.description || "",
			featured: override.featured ?? false,
		};
	});
}

export function sortProjects(projects: Project[]): Project[] {
	return [...projects].sort((a, b) => {
		if (a.featured && !b.featured) return -1;
		if (!a.featured && b.featured) return 1;

		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
	});
}
