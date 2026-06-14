import axios from 'axios'
import { PlaywrightCrawler, Dataset } from 'crawlee';

interface RepoMetadata {
    title: string,
    url: string,
    repoDescription: string,
    repoReadme: string
}
const repositories: RepoMetadata[] = [];

const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, enqueueLinks, log }) {
        console.log('request: ', request)

        const title = await page.title();
        log.info(`Title of ${request.loadedUrl} is ${title}`);
        if (request.label == "REPOSITORY"){
            const repoReadme = await page.locator('article.markdown-body').innerText();
            const repoDescription = await page.evaluate(() => {
                const about = [...document.querySelectorAll('h2')].find((el) => el?.textContent?.trim() === "About");
                return about?.nextElementSibling?.textContent?.trim()
            }) || ""
            repositories.push({ title, url: request.loadedUrl, repoDescription, repoReadme });
        }
        
        await enqueueLinks({
            selector: 'li[itemprop="owns"] h3 a',
            label: "REPOSITORY"
        });
    },
    headless: false,
    maxRequestsPerCrawl: 5
})


export async function githubScraper(username: string) {
    await crawler.run([`https://github.com/${username}?tab=repositories`]);
    return repositories
}