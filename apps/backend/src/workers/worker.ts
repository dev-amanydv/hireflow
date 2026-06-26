import { Worker } from "bullmq";
import IORedis from 'ioredis';
import { prisma } from "../../prisma/db";
import { uploadToBucket } from "../utils/upload";
import fs from 'fs';
import { buildSourceFetchFlow, type JobMeta } from "../queues/queue";
import { parseResume } from "../utils/parse";
import { fetchGithub } from "../utils/FetchGithub";

export const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

function startResumeParserWorker() {
    return new Worker(
        'resume-parse',
        async (job) => {
            const { meta } = job.data as { meta: JobMeta }

            if (job.name === 'parse-pdf'){
                const result = await parseResume(meta);
                await prisma.resume.update({
                    where: {
                        id: meta.resumeId
                    },
                    data: {
                        parsed: result
                    }
                });

                await buildSourceFetchFlow({
                    meta,
                    githubUrls: result.classifiedLinks.githubUrl,
                    siteUrls: result.classifiedLinks.websites
                });
                return;

            }
            if (job.name === 'assemble-profile'){

            }
        }
    )
}

function startSourceFetchWorker(){
    return new Worker('source-fetch', async (job) => {
        const { meta, url } = job.data;
        if (job.name === 'fetch-github') return fetchGithub(url);
        return fetchSite(url);
    }, {
        concurrency: 3,
        connection: connection,
        limiter: { max: 10, duration: 1_000 }
    })
}

const worker = new Worker('resume-upload', async job => {
    const { resumeId, s3Key, filePath, size } = job.data;

    await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'UPLOADING' }
    });

    const body = await fs.promises.readFile(filePath);
    const upload = await uploadToBucket(s3Key, body, size);
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

    if (!upload?.success) {
        if (isLastAttempt) {
            await prisma.resume.update({
                where: { id: resumeId },
                data: { status: 'FAILED', error: String(upload?.message ?? 'upload failed') }
            });
        }
        throw new Error(`Upload failed for ${s3Key}`);
    }

    await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'COMPLETE', url: s3Key }
    });
}, { connection });

worker.on('completed', async job => {
    try {
        await fs.promises.unlink(job.data.filePath);
        console.log('file deleted successfully');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('file does not exist');
        } else {
            console.error('error deleting file: ', error);
        }
    }
    console.log(`${job.id} has completed!`);
})

worker.on('failed', async (job, err) => {
    if (job && job?.attemptsMade >= (job?.opts.attempts ?? 1)) {
        await fs.promises.unlink(job.data.filePath).catch(() => { })
    }
    console.log(`${job?.id} has failed with ${err.message}!`);
})
