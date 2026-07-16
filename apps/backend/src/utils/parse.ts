import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist/legacy/build/pdf.mjs";

type ResumeLinks = {
    githubUrl: string[],
    websites: string[]
}

GlobalWorkerOptions.workerSrc = import.meta.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

export async function parseResume(filePath: string) {
    const bytes = new Uint8Array(await Bun.file(filePath).arrayBuffer());
    const doc: PDFDocumentProxy = await getDocument({ data: bytes }).promise;

    const text = await extractText(doc);
    const rawLinks: string[] = await extractLinks(doc);
    const classifiedLinks = classifyLinks(rawLinks)
    let usedOcr = false;

    

    return { text, usedOcr, classifiedLinks }
}

async function extractText(doc: PDFDocumentProxy) {
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
       const page = await doc.getPage(i);
       const content = await page.getTextContent();
       const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
       parts.push(pageText);
       page.cleanup();
    };
    return parts.join('\n').replace(/[ \t]+/g, ' ').trim();
};

function classifyLinks (rawLinks: string[]){
    const uniqueLinks = [...new Set(rawLinks)]
    const result: ResumeLinks = {
        websites: [],
        githubUrl: []
    };
    for (const link of uniqueLinks){
        try {
            const hostname = new URL(link).hostname.toLowerCase();

            if (hostname.includes('github.com')){
                result.githubUrl.push(link);
            } else {
                result.websites.push(link)
            }
        } catch (error) {
            
        }
    };
    return result;
}

async function extractLinks(doc: PDFDocumentProxy): Promise<string[]> {
    const urls = [];

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const annotations = await page.getAnnotations();
        for (const a of annotations) {
            if (a.subtype === 'Link' && typeof a.url === 'string' && a.url) {
                urls.push(a.url)
            }
        }
        page.cleanup()
    };
    return urls;
}

