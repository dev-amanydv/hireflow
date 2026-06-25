import { Worker } from "bullmq";
import IORedis from 'ioredis';
import { prisma } from "../../prisma/db";
import { uploadToBucket } from "../utils/upload";
import fs from 'fs';

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker('resume-upload', async job => {
    const { resumeId, s3Key, filePath, size } = job.data;

    await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'PROCESSING' }
    });

    const body = await fs.promises.readFile(filePath);
    const upload = await uploadToBucket(s3Key, body, size);

    if (!upload?.success) {
        await prisma.resume.update({
            where: { id: resumeId },
            data: { status: 'FAILED', error: String(upload?.message ?? 'upload failed') }
        });
        throw new Error(`Upload failed for ${s3Key}`);
    }

    await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'COMPLETED', url: s3Key }
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

worker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}!`);
})
