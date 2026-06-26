import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

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
    //https://github.com/ali-imtiyazkhan/ali-imtiyazkhan
    const username = url.includes('http') ? url.split('/')[3] : url.split('/')[1];
    const repoName = url.includes('http') ? url.split('/')[4] : url.split('/')[2];
    return { username: username, repo: repoName ? repoName : null }
}

export async function fetchGithub(url: string) {
    const details = extractGithub(url);
    console.log(details);
    let result: Result = {
        user: null,
        repo: null
    }
    const username = details.username;

    try {
        if (details.username) {
            const { data } = await octokit.rest.users.getByUsername({
                username: details.username
            });
            result.user = {
                bio: data.bio || "",
                username: details.username,
                name: data.name || "",
                location: data.location || ""
            };
            if (!details.repo) {
                const { data: repoList } = await octokit.rest.repos.listForUser({
                    username: details.username,
                    sort: 'pushed',
                    per_page: 100,
                    type: 'owner'
                });

                const repos = repoList.filter((r) => !r.fork).sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0)).slice(0, 5).map((r) => ({
                    name: r.name,
                    description: r.description ?? null,
                    language: r.language ?? null,
                    stars: r.stargazers_count ?? 0,
                    url: r.html_url,
                    readme: null
                }));
                return { kind: 'github', ok: true, url, username, repos }
            }
        };
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
            return { kind: 'github', ok: true, url, repos: [data] }
        }
    } catch (error) {
        return {
            kind: 'github',
            ok:false,
            url,
            username,
            repos: [],
            error: error instanceof Error ? error.message : 'github fetch failed'
        }
    }

}