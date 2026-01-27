export interface GitHubRepo {
	archived: boolean;
	description: null | string;
	fork: boolean;
	forks_count: number;
	full_name: string;
	homepage: null | string;
	html_url: string;
	language: null | string;
	name: string;
	stargazers_count: number;
	topics: string[];
	updated_at: string;
}

export interface Project extends GitHubRepo {
	customDescription?: string;
	customName?: string;
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

			if (response.ok) return (await response.json()) as GitHubRepo;
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
		return (await response.json()) as GitHubRepo;
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

export function mergeProjectData(
	repos: GitHubRepo[],
	overrides: Partial<Record<string, Partial<Project>>>,
): Project[] {
	return repos.map((repo) => {
		const override = overrides[repo.full_name] ?? overrides[repo.name] ?? {};
		return {
			...repo,
			description: override.customDescription ?? repo.description ?? "",
			featured: override.featured ?? false,
			name: override.customName ?? repo.name,
		};
	});
}

export function normalizeRepoName(repoName: string, defaultOwner = "kesku"): string {
	if (repoName.includes("/")) {
		return repoName;
	}
	return `${defaultOwner}/${repoName}`;
}

export function sortProjects(projects: Project[]): Project[] {
	return [...projects].sort((a, b) => {
		if (a.featured && !b.featured) return -1;
		if (!a.featured && b.featured) return 1;

		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
	});
}
