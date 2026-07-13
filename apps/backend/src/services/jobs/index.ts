import type { JobAdapter } from "./types";
import { remotiveAdapter } from "./remotive";
import { arbeitnowAdapter } from "./arbeitnow";
import { adzunaAdapter } from "./adzuna";

export const adapters: JobAdapter[] = [
  remotiveAdapter,
  arbeitnowAdapter,
  adzunaAdapter,
];

export type { JobAdapter, NormalizedJob } from "./types";
