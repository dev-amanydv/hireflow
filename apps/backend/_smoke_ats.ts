import { analyzeResume } from "./src/services/ats";
import type { ParsedSummary } from "./src/services/ats";

const summary: ParsedSummary = {
  name: "Aarav Sharma",
  role: "Backend Engineer",
  summary: "Backend engineer with 4 years building high-throughput payment systems.",
  yearOfExp: "<5 year",
  email: "aarav@example.com",
  linkedIn: "https://linkedin.com/in/aaravsharma",
  github: "https://github.com/aaravsharma",
  phone: "+91 90000 00000",
  technicalSkills: [
    { name: "Node.js", usedIn: null },
    { name: "PostgreSQL", usedIn: null },
    { name: "Redis", usedIn: null },
  ],
  experience: [
    {
      role: "Backend Engineer",
      company: "Razorpay",
      duration: "2021-2025",
      work: [
        "Reduced payment API p99 latency by 45% by adding Redis caching",
        "Migrated a monolith to services handling 12k req/s",
        "Responsible for various backend tasks",
      ],
    },
  ],
  projects: [
    { name: "ledger-stream", skills: ["Kafka"], readmeSummary: ["Event-sourced ledger"], about: ["Built idempotent double-entry ledger with Kafka projections"] },
  ],
  education: [{ qualification: "B.Tech CSE", institution: "IIT", startingYear: "2017" }],
};

const rawText = `Aarav Sharma\nBackend Engineer\naarav@example.com | linkedin.com/in/aaravsharma | github.com/aaravsharma\nExperience Skills Education Projects Summary\n${"Experienced backend engineer building distributed systems. ".repeat(20)}`;

const t0 = Date.now();
const report = await analyzeResume({
  rawText,
  usedOcr: false,
  summary,
  target: {
    role: "Backend Engineer",
    experience: "mid",
    jdText: "We need a backend engineer strong in Node.js, PostgreSQL, Redis, Kafka, AWS, and distributed systems. Kubernetes and Go a plus.",
  },
});

console.log(JSON.stringify({
  seconds: Math.round((Date.now() - t0) / 1000),
  overallScore: report.overallScore,
  judge: report.engine.judge,
  keywordCoverage: report.keyword?.coverage,
  findingsCount: report.findings.length,
  lastFindingComplete: Boolean(report.findings.at(-1)?.suggestion),
}, null, 2));
