import type { JobMeta } from "../queues/queue";
import type { GithubContent } from "./FetchGithub";
import type { SiteContent } from "./FetchSite";

type FetchResult = GithubContent | SiteContent;

export type AssembledSources = {
    rawResumeText: string,
    usedOcr: boolean,
    githubSources: GithubContent[],
    siteSources: SiteContent[]
}
export function assembleProfile (text: string, meta: JobMeta, chidlResults: FetchResult[]): AssembledSources{
    const githubSources = [];
    const siteSources = [];

    for (const r of chidlResults){
        if (r.kind === 'github'){
            githubSources.push(r)
        } else {
            siteSources.push(r)
        }
    }

    return {
        rawResumeText: text,
        usedOcr: false,
        githubSources: githubSources,
        siteSources: siteSources
    }
}