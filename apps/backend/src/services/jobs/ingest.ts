import { prisma } from "../../../prisma/db";
import { adapters } from "./index";
import type { NormalizedJob } from "./types";

async function upsertJob(job: NormalizedJob) {
  await prisma.job.upsert({
    where: {
      source_externalId: { source: job.source, externalId: job.externalId },
    },
    create: { ...job, fetchedAt: new Date() },
    update: { ...job, fetchedAt: new Date() },
  });
} 

export async function ingestJobs(): Promise<{ upserted: number }> {
  let upserted = 0;

  for (const adapter of adapters) {
    try {
      const jobs = await adapter.fetch();
      for (const job of jobs) {
        try {
          await upsertJob(job);
          upserted++;
        } catch (err) {
          console.error(
            `[jobs-ingest] upsert failed (${job.source}:${job.externalId})`,
            err,
          );
        }
      }
      console.log(`[jobs-ingest] ${adapter.source}: ${jobs.length} fetched`);
    } catch (err) {
      console.error(`[jobs-ingest] source ${adapter.source} failed`, err);
    }
  }

  console.log(`[jobs-ingest] done — ${upserted} jobs upserted`);
  return { upserted };
}
