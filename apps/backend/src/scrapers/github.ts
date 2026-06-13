import axios from 'axios'
import { PlaywrightCrawler, Dataset } from 'crawlee';

const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, enqueueLinks, log }) {
        console.log('request: ', request)

        const title = await page.title();
        log.info(`Title of ${request.loadedUrl} is ${title}`);

        await Dataset.pushData({ title, url: request.loadedUrl });
        await enqueueLinks({
            selector: 'li[itemprop="owns"] h3 a'
        });
    },
    headless: false,
    maxRequestsPerCrawl: 15
})

await crawler.run(['https://github.com/dev-amanydv?tab=repositories']);

interface UserRepos {
    description: string,
    name: string,
    full_name: string
}

export async function githubScraper(username: string) {
    const res = await axios.get(`https://api.github.com/users/${username}/repos`)
    console.log(res.data)
    return res.data.map((x: UserRepos) => ({
        description: x.description,
        name: x.name,
        fullName: x.full_name
    }))
}