import { Worker } from "bullmq";
import IORedis from 'ioredis';
import { prisma } from "../../prisma/db";
import { uploadToBucket } from "../utils/upload";
import fs from 'fs';
import {
    buildSourceFetchFlow, enqueueResumeParse, type JobMeta,
    type AnalysisMeta, enqueueAnalysisParse, buildAnalysisSourceFetchFlow
} from "../queues/queue";
import { parseResume } from "../utils/parse";
import { fetchGithub } from "../utils/FetchGithub";
import { fetchSite } from "../utils/FetchSite";
import { assembleProfile, type AssembledSources } from "../utils/AssembleProfile";
import { Prisma } from "../generated/prisma/client";
import { ingestJobs } from "../services/jobs/ingest";
import { getResumeSummary } from "../services/openai";
import { analyzeResume, type ParsedSummary } from "../services/ats";

export const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

export function startResumeParserWorker() {
    return new Worker(
        'resume-parse',
        async (job) => {
            const { meta } = job.data as { meta: JobMeta }
            console.log("============RESUME_PARSE_STARTED============")
            console.log('jobName: ', job.name,"\njobData: ", meta)
            if (job.name === 'parse-pdf') {
                const { filePath } = job.data as { filePath: string };
                await prisma.resume.update({
                    where: {
                        id: meta.resumeId
                    },
                    data: {
                        status: 'PARSING'
                    }
                });
                const result = await parseResume(filePath);
                console.log('parseResume: ', result)
                await prisma.resume.update({
                    where: {
                        id: meta.resumeId
                    },
                    data: {
                        parsed: result,
                    }
                });
                
                await buildSourceFetchFlow({
                    meta,
                    text: result.text,
                    githubUrls: result.classifiedLinks.githubUrl,
                    siteUrls: result.classifiedLinks.websites
                });

                await fs.promises.unlink(filePath).then(() => console.log(`${filePath} deleted sucessfully!!`)).catch((error) => { if (error.code === 'ENOENT') {
            console.log('file does not exist');
        } else {
            console.error('error deleting file: ', error);
        }});
                return;
            }
            if (job.name === 'assemble-profile') {
                const { meta, text } = job.data;
                const childResponse = await job.getChildrenValues();
                const childResults = Object.values(childResponse);

                const profile = assembleProfile(text, meta, childResults);
                await prisma.resume.update({
                    where: {
                        id: meta.resumeId
                    },
                    data: {
                        parsed: profile as unknown as Prisma.InputJsonValue,
                        status: 'PARSED'
                    }
                });
                return
            }
        }, {
        connection: connection
    }
    )
}

export function startJobsIngestWorker() {
    return new Worker('jobs-ingest', async () => {
        console.log("============JOBS_INGEST_STARTED============");
        return ingestJobs();
    }, {
        concurrency: 1,
        connection: connection,
        limiter: { max: 10, duration: 1_000 }
    })
}

export function startSourceFetchWorker() {
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
    const { resumeId, s3Key, filePath, size, interviewId } = job.data;

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
    return { resumeId, s3Key, interviewId }
}, { connection });

worker.on('completed', async (job, returnValue) => {
    try {
        
        await enqueueResumeParse({
            resumeId: returnValue.resumeId,
            s3key: returnValue.s3Key,
            interviewId: returnValue.interviewId
        }, job.data.filePath);
    } catch (error) {
        console.log(error)
    }
    console.log(`${job.id} has completed!`);
})

worker.on('failed', async (job, err) => {
    if (job && job?.attemptsMade >= (job?.opts.attempts ?? 1)) {
        await fs.promises.unlink(job.data.filePath).catch(() => { })
    }
    console.log(`${job?.id} has failed with ${err.message}!`);
})


export function startResumeAnalysisUploadWorker() {
    const w = new Worker('resume-analysis-upload', async job => {
        const { meta, filePath, size } = job.data as { meta: AnalysisMeta, filePath: string, size: number };
        const body = await fs.promises.readFile(filePath);
        const upload = await uploadToBucket(meta.s3key, body, size);
        const isLast = job.attemptsMade >= (job.opts.attempts ?? 1);

        if (!upload?.success) {
            if (isLast) {
                await prisma.resumeAnalysis.update({
                    where: { id: meta.analysisId },
                    data: { status: 'FAILED', error: String(upload?.message ?? 'upload failed') }
                });
            }
            throw new Error(`Analysis upload failed for ${meta.s3key}`);
        }

        await prisma.resumeAnalysis.update({ where: { id: meta.analysisId }, data: { url: meta.s3key } });
        return { meta, filePath };
    }, { connection });

    w.on('completed', async (_job, ret: { meta: AnalysisMeta, filePath: string }) => {
        try {
            await enqueueAnalysisParse(ret.meta, ret.filePath);
        } catch (error) {
            console.log(error);
        }
    });

    w.on('failed', async (job, err) => {
        if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
            await fs.promises.unlink(job.data.filePath).catch(() => { });
        }
        console.log(`analysis-upload ${job?.id} failed: ${err.message}`);
    });

    return w;
}

export function startResumeAnalysisParserWorker() {
    return new Worker('resume-analysis-parse', async job => {
        const { meta } = job.data as { meta: AnalysisMeta };

        if (job.name === 'parse-pdf') {
            const { filePath } = job.data as { filePath: string };
            await prisma.resumeAnalysis.update({ where: { id: meta.analysisId }, data: { status: 'PARSING' } });

            const result = await parseResume(filePath);
            await prisma.resumeAnalysis.update({
                where: { id: meta.analysisId },
                data: { parsed: result as unknown as Prisma.InputJsonValue }
            });

            await buildAnalysisSourceFetchFlow({
                meta,
                text: result.text,
                githubUrls: result.classifiedLinks.githubUrl,
                siteUrls: result.classifiedLinks.websites
            });

            await fs.promises.unlink(filePath).catch(() => { });
            return;
        }

        if (job.name === 'assemble-profile') {
            const { text } = job.data as { text: string };
            const childResponse = await job.getChildrenValues();
            const childResults = Object.values(childResponse);

            const profile = assembleProfile(
                text,
                { resumeId: meta.analysisId, s3key: meta.s3key, interviewId: '' },
                childResults
            );
            const summary = await getResumeSummary(profile);

            await prisma.resumeAnalysis.update({
                where: { id: meta.analysisId },
                data: {
                    parsed: profile as unknown as Prisma.InputJsonValue,
                    status: 'PARSED',
                    ...(summary ? { summary: summary as Prisma.InputJsonValue } : {})
                }
            });
            return;
        }
    }, { connection });
}

export function startResumeAnalysisScoreWorker() {
    const w = new Worker('resume-analysis-score', async job => {
        const { meta } = job.data as { meta: AnalysisMeta };
        const row = await prisma.resumeAnalysis.findUnique({ where: { id: meta.analysisId } });
        if (!row) return;

        await prisma.resumeAnalysis.update({ where: { id: meta.analysisId }, data: { status: 'ANALYZING' } });

        const parsed = (row.parsed ?? {}) as unknown as Partial<AssembledSources> & { text?: string };
        const summary = (row.summary ?? null) as unknown as ParsedSummary | null;

        const report = await analyzeResume({
            rawText: parsed.rawResumeText ?? parsed.text ?? '',
            usedOcr: Boolean(parsed.usedOcr),
            summary,
            target: {
                role: row.targetRole ?? null,
                experience: row.targetExperience ?? null,
                jdText: row.targetJdText ?? null
            }
        });

        await prisma.resumeAnalysis.update({
            where: { id: meta.analysisId },
            data: {
                overallScore: report.overallScore,
                report: report as unknown as Prisma.InputJsonValue,
                status: 'COMPLETE'
            }
        });
    }, { connection });

    w.on('failed', async (job, err) => {
        const meta = job?.data?.meta as AnalysisMeta | undefined;
        if (meta && job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
            await prisma.resumeAnalysis.update({
                where: { id: meta.analysisId },
                data: { status: 'FAILED', error: err.message }
            }).catch(() => { });
        }
        console.log(`analysis-score ${job?.id} failed: ${err.message}`);
    });

    return w;
}
