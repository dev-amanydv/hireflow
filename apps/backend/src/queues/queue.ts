import { Queue } from "bullmq";
import { connection } from "../workers/worker";

export const resumeQueue = new Queue('resume-upload', {
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