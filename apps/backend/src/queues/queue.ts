import { FlowProducer, Queue, type FlowJob, type JobsOptions } from "bullmq";
import { connection } from "../workers/worker";

export interface JobMeta {
    resumeId: string,
    s3key: string,
    interviewId: string
}

const fetchChildOpts: JobsOptions = {
    attempts: 3,
    backoff: {
        type: "exponential", delay: 1_500
    },
    removeOnComplete: true,
    removeOnFail: {
        age: 24 * 3_600
    },
    ignoreDependencyOnFailure: true
}

export const resumeUploadQueue = new Queue('resume-upload', {
    connection: connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: {
            age: 3600
        },
        removeOnFail: {
            age: 24 * 3600
        }
    }
});

export const resumeParseQueue = new Queue('resume-parse', {
    connection: connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { age: 3_600 },
        removeOnFail: { age: 24 * 3_600}
    }
});

export const jobsIngestQueue = new Queue('jobs-ingest', {
    connection: connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 3_600 },
        removeOnFail: { age: 24 * 3_600 }
    }
});

const JOBS_INGEST_EVERY_MS = 30 * 60 * 1_000;


export async function scheduleJobsIngest() {
    await jobsIngestQueue.upsertJobScheduler(
        'jobs-ingest-cron',
        { every: JOBS_INGEST_EVERY_MS },
        { name: 'ingest' }
    );
    await jobsIngestQueue.add('ingest', {}, { jobId: 'jobs-ingest-initial' });
}

export const flowProducer = new FlowProducer({ connection });

const id = (job: string, m: JobMeta, extra?: string) => {
    return `${job}-${m.resumeId}${extra ? '-' + extra : ''}`
}

export async function enqueueResumeParse(meta: JobMeta, filePath: string){
    return await resumeParseQueue.add('parse-pdf', { meta, filePath }, { jobId: id('parse-pdf', meta)})
}

export function buildSourceFetchFlow (input: {
    meta: JobMeta,
    text: string,
    githubUrls: string[],
    siteUrls: string[]
}){
    const { meta, githubUrls, siteUrls, text } = input;

    const children: FlowJob[] = [];

    for (const url of githubUrls){
        children.push({
            name: 'fetch-github',
            queueName: 'source-fetch',
            data: {
                meta, url
            },
            opts: {
                ...fetchChildOpts, jobId: id('fetch-github', meta, encodeURIComponent(url))
            }
        })
    };

    for (const url of siteUrls){
        children.push({
            name: 'fetch-site',
            queueName: 'source-fetch',
            data: {
                meta, url
            },
            opts: {
                ...fetchChildOpts, jobId: id('fetch-site', meta, encodeURIComponent(url))
            }
        })
    };

    return flowProducer.add({
        name: 'assemble-profile',
        queueName: 'resume-parse',
        data: { meta, text },
        children
    })
}
