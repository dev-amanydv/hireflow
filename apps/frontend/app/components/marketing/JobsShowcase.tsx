import { MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import ProductSection from "./ProductSection";

type MockJob = {
  company: string;
  mark: string;
  title: string;
  location: string;
  remote: boolean;
  jobType: string;
  tags: string[];
  salary: string;
  source: string;
  match: number;
};

// `source` reflects the real aggregation: postings are pulled from these boards.
const JOBS: MockJob[] = [
  {
    company: "Vercel",
    mark: "V",
    title: "Senior Backend Engineer",
    location: "Remote",
    remote: true,
    jobType: "Full-time",
    tags: ["Node.js", "Postgres"],
    salary: "$160k – $190k",
    source: "Remotive",
    match: 92,
  },
  {
    company: "Ramp",
    mark: "R",
    title: "Platform Engineer",
    location: "New York, NY",
    remote: true,
    jobType: "Full-time",
    tags: ["Go", "Kubernetes"],
    salary: "$150k – $180k",
    source: "Adzuna",
    match: 81,
  },
  {
    company: "Linear",
    mark: "L",
    title: "Frontend Engineer",
    location: "Remote",
    remote: true,
    jobType: "Contract",
    tags: ["React", "TypeScript"],
    salary: "$120k – $150k",
    source: "Arbeitnow",
    match: 74,
  },
];

function JobRow({ job, index }: { job: MockJob; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: reduce
            ? { duration: 0 }
            : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
        },
      }}
      className="flex flex-col gap-3 border-b border-border py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-[13px] font-semibold text-background">
          {job.mark}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-foreground">
            {job.title}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-subtle">
            <span>{job.company}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {job.location}
            </span>
            <span>{job.jobType}</span>
            <span className="ln-mono rounded border border-hairline bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-tertiary">
              via {job.source}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-12 sm:pl-0">
        <div className="hidden text-[12.5px] text-ink-subtle sm:block">
          {job.salary}
        </div>
        <div className="flex w-24 flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="ln-mono text-ink-tertiary">match</span>
            <span className="ln-mono text-foreground">{job.match}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: reduce ? `${job.match}%` : "0%" }}
              whileInView={{ width: `${job.match}%` }}
              viewport={{ once: true, margin: "-80px" }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.6, delay: 0.2 + index * 0.1, ease: "easeOut" }
              }
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function JobListMockup() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: {
          transition: reduce ? {} : { staggerChildren: 0.08 },
        },
      }}
    >
      {JOBS.map((job, i) => (
        <JobRow key={job.company} job={job} index={i} />
      ))}
    </motion.div>
  );
}

export default function JobsShowcase() {
  return (
    <ProductSection
      label="5.0  Jobs"
      title="See roles matched to what you just proved you can do"
      description="Hireflow aggregates live openings from Remotive, Arbeitnow, and Adzuna, then surfaces the ones that line up with the skills and level you've actually demonstrated — not just keywords on a resume."
    >
      <JobListMockup />
    </ProductSection>
  );
}
