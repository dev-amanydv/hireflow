import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

interface Repo {
    name: string,
    description: string,
    language: string,
    stars: number,
    readme: string
}
export interface GithubContent {
    kind: 'github',
    ok: boolean,
    url: string,
    repos: Repo[] | [],
    error?: string
}
interface Result {
    user: {
        bio: string,
        username: string,
        name: string,
        location: string
    } | null,
    repo: {
        name: string,
        readme: string
    } | null
}

function extractGithub(url: string) {
    const username = url.includes('http') ? url.split('/')[3] : url.split('/')[1];
    const repoName = url.includes('http') ? url.split('/')[4] : url.split('/')[2];
    return { username: username, repo: repoName ? repoName : null }
}

export async function fetchGithub(url: string): Promise<GithubContent> {
    const details = extractGithub(url);
    let result: Result = {
        user: null,
        repo: null
    }
    const username = details.username;
    if (!username) return {
        kind: 'github',
        ok: false,
        url,
        repos: [],
        error: 'github username not found'
    }

    const { data } = await octokit.rest.users.getByUsername({
        username: username
    });
    result.user = {
        bio: data.bio || "",
        username: username,
        name: data.name || "",
        location: data.location || ""
    };
    try {
        if (details.repo && details.username) {
            const { data } = await octokit.rest.repos.getReadme({
                owner: details.username,
                repo: details.repo,
                mediaType: {
                    format: 'raw'
                }
            });
            result.repo = {
                name: details.repo,
                readme: data as unknown as string
            }
            return { kind: 'github', ok: true, url, repos: [{ name: details.repo, description: "", language: "", stars: 0, readme: data as unknown as string }] }
        }
    } catch (error) {
        return {
            kind: 'github',
            ok: false,
            url,
            repos: [],
            error: error instanceof Error ? error.message : 'github fetch failed'
        }
    };
   
        const { data: repoList } = await octokit.rest.repos.listForUser({
            username: username,
            sort: 'pushed',
            per_page: 100,
            type: 'owner'
        });

        const repos = repoList.filter((r) => !r.fork).sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0)).slice(0, 5).map((r) => ({
            name: r.name,
            description: r.description ?? "",
            language: r.language ?? "",
            stars: r.stargazers_count ?? 0,
            readme: ""
        })) || [];
        return { kind: 'github', ok: true, url, repos }
    
}