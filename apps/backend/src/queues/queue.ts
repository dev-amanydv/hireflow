import { FlowProducer, Queue, type FlowJob, type JobsOptions } from "bullmq";
import { connection } from "../workers/worker";

export interface JobMeta {
    resumeId: string,
    filePath: string,
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

export const flowProducer = new FlowProducer({ connection });

const id = (job: string, m: JobMeta, extra?: string) => {
    return `${job}:${m.resumeId}${extra ? ':' + extra : ''}`
}

export function enqueueResumeParse(meta: JobMeta){
    return resumeParseQueue.add('parse-pdf', {meta}, { jobId: id('parse-pdf', meta)})
}

export function buildSourceFetchFlow (input: {
    meta: JobMeta,
    githubUrls: string[],
    siteUrls: string[]
}){
    const { meta, githubUrls, siteUrls } = input;

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
        data: { meta },
        children
    })
}
