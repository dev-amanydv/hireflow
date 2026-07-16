
export type Difficulty = "beginner" | "junior" | "mid" | "senior" | "staff";

export interface SkillTopic {
  name: string;
  subtopics: string[];
}

export interface Skill {
  id: string;
  label: string;
  blurb: string;
  topics: SkillTopic[];
  levelRubric: Record<Difficulty, string>;
}

export const SKILL_CATALOG: Skill[] = [
  {
    id: "react",
    label: "React",
    blurb: "Hooks, rendering, state management, and performance.",
    topics: [
      {
        name: "Virtual DOM & reconciliation",
        subtopics: [
          "diffing algorithm",
          "keys",
          "fiber architecture",
          "batching",
        ],
      },
      {
        name: "Hooks",
        subtopics: [
          "useState/useEffect",
          "useReducer",
          "useMemo/useCallback",
          "custom hooks",
          "rules of hooks",
        ],
      },
      {
        name: "State management",
        subtopics: [
          "Context vs prop drilling",
          "Redux",
          "lifting state",
          "derived state",
        ],
      },
      {
        name: "Performance",
        subtopics: [
          "memoization",
          "avoiding re-renders",
          "code splitting",
          "lazy/Suspense",
          "list virtualization",
        ],
      },
      {
        name: "Rendering & data flow",
        subtopics: [
          "controlled vs uncontrolled",
          "SSR/hydration",
          "React Server Components",
          "error boundaries",
        ],
      },
      {
        name: "Modern React (18/19)",
        subtopics: [
          "concurrent features",
          "Actions & forms",
          "the use hook",
          "React Compiler",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Explains what React is and why; writes basic components, JSX, and simple useState/useEffect.",
      junior:
        "Uses hooks correctly, understands the render cycle and keys, manages component-local state cleanly.",
      mid: "Reasons about re-render causes and performance trade-offs; structures state and effects deliberately.",
      senior:
        "Designs reusable component systems; deep on reconciliation, memoization, and data-fetching patterns.",
      staff:
        "Sets frontend architecture and standards; justifies framework-level and rendering-strategy trade-offs.",
    },
  },
  {
    id: "nodejs",
    label: "Node.js",
    blurb: "Event loop, async I/O, streams, and scaling backends.",
    topics: [
      {
        name: "Event loop & runtime",
        subtopics: [
          "libuv & V8",
          "event loop phases",
          "microtasks vs macrotasks",
          "process.nextTick",
        ],
      },
      {
        name: "Asynchronous programming",
        subtopics: [
          "callbacks",
          "promises",
          "async/await",
          "error handling",
          "avoiding blocking the loop",
        ],
      },
      {
        name: "Streams & buffers",
        subtopics: [
          "readable/writable/transform",
          "backpressure",
          "piping",
          "large-file handling",
        ],
      },
      {
        name: "Scaling & concurrency",
        subtopics: [
          "cluster module",
          "worker_threads",
          "CPU-bound vs I/O-bound",
          "load balancing",
        ],
      },
      {
        name: "APIs & architecture",
        subtopics: [
          "Express/HTTP",
          "middleware",
          "REST design",
          "auth",
          "queues/message brokers",
        ],
      },
      {
        name: "Production concerns",
        subtopics: [
          "memory leaks & heap profiling",
          "logging/observability",
          "security",
          "env/secrets",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Explains what Node is and its non-blocking model; writes a simple HTTP server or script.",
      junior:
        "Comfortable with async/await and Express; understands the event loop at a high level.",
      mid: "Handles streams and backpressure; reasons about blocking work and basic scaling.",
      senior:
        "Designs scalable services; deep on event-loop internals, worker_threads, and production debugging.",
      staff:
        "Owns backend platform decisions; justifies concurrency model, throughput, and reliability trade-offs.",
    },
  },
  {
    id: "distributed-systems",
    label: "Distributed Systems",
    blurb: "Consistency, replication, partitioning, and consensus.",
    topics: [
      {
        name: "Consistency & CAP",
        subtopics: [
          "CAP theorem",
          "strong vs eventual consistency",
          "tunable consistency",
          "linearizability",
        ],
      },
      {
        name: "Replication",
        subtopics: [
          "leader-follower",
          "multi-leader",
          "sync vs async",
          "read/write quorums",
        ],
      },
      {
        name: "Partitioning & sharding",
        subtopics: [
          "range vs hash",
          "consistent hashing",
          "rebalancing",
          "hot partitions",
        ],
      },
      {
        name: "Consensus & coordination",
        subtopics: [
          "Paxos vs Raft",
          "leader election",
          "when to use consensus",
          "distributed locks",
        ],
      },
      {
        name: "Fault tolerance",
        subtopics: [
          "redundancy",
          "failure detection",
          "retries & idempotency",
          "quorum recovery",
        ],
      },
      {
        name: "Messaging & time",
        subtopics: [
          "delivery semantics",
          "ordering",
          "logical clocks",
          "exactly-once challenges",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Explains why distributed systems are hard and what a partition/replica is at a high level.",
      junior:
        "Understands CAP and basic replication; can reason about eventual consistency.",
      mid: "Contrasts replication and partitioning strategies and their consistency/performance impact.",
      senior:
        "Reasons about consensus, quorums, and failure recovery; justifies trade-offs concretely.",
      staff:
        "Designs large distributed architectures; defends deep consistency, coordination, and durability trade-offs.",
    },
  },
  {
    id: "system-design",
    label: "System Design",
    blurb: "Scalability, caching, load balancing, and data storage.",
    topics: [
      {
        name: "Requirements & estimation",
        subtopics: [
          "functional vs non-functional",
          "back-of-envelope",
          "traffic/QPS",
          "SLAs",
        ],
      },
      {
        name: "Scaling",
        subtopics: [
          "vertical vs horizontal",
          "statelessness",
          "single points of failure",
          "read/write scaling",
        ],
      },
      {
        name: "Load balancing & routing",
        subtopics: [
          "round-robin/least-connections",
          "consistent hashing",
          "reverse proxies",
          "CDNs",
        ],
      },
      {
        name: "Caching",
        subtopics: [
          "cache-aside/write-through",
          "eviction (LRU/TTL)",
          "Redis",
          "cache invalidation",
        ],
      },
      {
        name: "Data storage",
        subtopics: [
          "SQL vs NoSQL",
          "indexing",
          "partitioning/replication",
          "denormalization",
        ],
      },
      {
        name: "Async & reliability",
        subtopics: [
          "message queues",
          "rate limiting",
          "idempotency",
          "monitoring & failover",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Sketches a simple client-server-database design and names one scaling idea.",
      junior: "Adds caching and a load balancer; explains why each helps.",
      mid: "Drives a design end-to-end with reasonable estimation and data-store choices.",
      senior:
        "Handles scale, consistency, and reliability trade-offs; identifies bottlenecks proactively.",
      staff:
        "Leads ambiguous large-scale designs; balances cost, reliability, and evolution over time.",
    },
  },
  {
    id: "sql-databases",
    label: "SQL & Databases",
    blurb: "Querying, indexing, transactions, and optimization.",
    topics: [
      {
        name: "Querying",
        subtopics: [
          "joins",
          "GROUP BY/HAVING",
          "subqueries & CTEs",
          "window functions",
        ],
      },
      {
        name: "Indexing",
        subtopics: [
          "B-tree indexes",
          "clustered vs non-clustered",
          "composite indexes",
          "index-only scans",
        ],
      },
      {
        name: "Transactions",
        subtopics: ["ACID", "isolation levels", "locking", "deadlocks"],
      },
      {
        name: "Schema design",
        subtopics: [
          "normalization (1NF-3NF)",
          "denormalization",
          "keys & constraints",
          "relationships",
        ],
      },
      {
        name: "Query optimization",
        subtopics: [
          "EXPLAIN/query plans",
          "sargability",
          "N+1 queries",
          "avoiding full scans",
        ],
      },
      {
        name: "SQL vs NoSQL",
        subtopics: [
          "when to use each",
          "consistency models",
          "scaling reads/writes",
          "OLTP vs OLAP",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Writes basic SELECT/WHERE and simple joins; knows what a primary key is.",
      junior:
        "Comfortable with joins and aggregation; understands what an index is for.",
      mid: "Reasons about indexing, transactions, and normalization trade-offs.",
      senior:
        "Optimizes queries from plans; reasons about isolation, locking, and schema at scale.",
      staff:
        "Owns data architecture; justifies storage engine, consistency, and modeling decisions.",
    },
  },
  {
    id: "javascript",
    label: "JavaScript / TypeScript",
    blurb: "Language internals, async, and the type system.",
    topics: [
      {
        name: "Core semantics",
        subtopics: [
          "closures",
          "scope & hoisting",
          "this binding",
          "prototypes & inheritance",
        ],
      },
      {
        name: "Async model",
        subtopics: ["event loop", "promises", "async/await", "microtask queue"],
      },
      {
        name: "Types & coercion",
        subtopics: [
          "primitives vs objects",
          "equality & coercion",
          "immutability",
          "value vs reference",
        ],
      },
      {
        name: "Functions & patterns",
        subtopics: [
          "higher-order functions",
          "currying",
          "modules",
          "iterators/generators",
        ],
      },
      {
        name: "TypeScript",
        subtopics: [
          "structural typing",
          "generics",
          "unions & narrowing",
          "utility types",
        ],
      },
      {
        name: "Browser & memory",
        subtopics: [
          "DOM/events",
          "garbage collection",
          "memory leaks",
          "debounce/throttle",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Explains variables, functions, and basic async; reads simple code confidently.",
      junior:
        "Understands closures, this, and promises; uses TypeScript's basic types.",
      mid: "Reasons about the event loop, coercion pitfalls, and generics with confidence.",
      senior:
        "Deep on language internals, async edge cases, and advanced TypeScript modeling.",
      staff:
        "Sets language/tooling standards; justifies typing strategy and runtime trade-offs.",
    },
  },
  {
    id: "python",
    label: "Python",
    blurb: "Language model, data structures, and idioms.",
    topics: [
      {
        name: "Data model",
        subtopics: [
          "mutability",
          "references",
          "dunder methods",
          "iterables & iterators",
        ],
      },
      {
        name: "Built-in structures",
        subtopics: [
          "list/dict/set/tuple",
          "comprehensions",
          "collections module",
          "time complexity",
        ],
      },
      {
        name: "Functions & scope",
        subtopics: [
          "*args/**kwargs",
          "closures",
          "decorators",
          "generators & yield",
        ],
      },
      {
        name: "OOP",
        subtopics: [
          "classes",
          "inheritance & MRO",
          "dataclasses",
          "duck typing",
        ],
      },
      {
        name: "Concurrency",
        subtopics: [
          "the GIL",
          "threading vs multiprocessing",
          "asyncio",
          "when to use each",
        ],
      },
      {
        name: "Idioms & tooling",
        subtopics: [
          "context managers",
          "exceptions (EAFP)",
          "typing hints",
          "memory management",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Writes basic scripts, loops, and functions; uses lists and dicts.",
      junior:
        "Comfortable with comprehensions, classes, and common standard-library modules.",
      mid: "Uses decorators, generators, and context managers; understands the GIL at a high level.",
      senior:
        "Deep on the data model, concurrency trade-offs, and performance/memory behavior.",
      staff:
        "Sets Python standards; justifies concurrency, packaging, and architecture decisions.",
    },
  },
  {
    id: "dsa",
    label: "Data Structures & Algorithms",
    blurb: "Core structures, algorithms, and complexity analysis.",
    topics: [
      {
        name: "Complexity",
        subtopics: [
          "Big-O time & space",
          "amortized analysis",
          "trade-off reasoning",
        ],
      },
      {
        name: "Arrays & strings",
        subtopics: ["two pointers", "sliding window", "prefix sums", "hashing"],
      },
      {
        name: "Linked lists & stacks/queues",
        subtopics: ["pointer manipulation", "monotonic stack", "deques"],
      },
      {
        name: "Trees & graphs",
        subtopics: [
          "BFS/DFS",
          "binary search trees",
          "topological sort",
          "shortest paths",
        ],
      },
      {
        name: "Searching & sorting",
        subtopics: [
          "binary search",
          "quicksort/mergesort",
          "heaps/priority queues",
        ],
      },
      {
        name: "Dynamic programming & recursion",
        subtopics: [
          "memoization",
          "tabulation",
          "greedy vs DP",
          "backtracking",
        ],
      },
    ],
    levelRubric: {
      beginner:
        "Knows core structures and can reason about simple loops and Big-O informally.",
      junior:
        "Solves straightforward array/string/hashmap problems and analyzes their complexity.",
      mid: "Handles trees, graphs, and standard DP; picks appropriate structures deliberately.",
      senior:
        "Solves and optimizes hard problems; reasons crisply about trade-offs and edge cases.",
      staff:
        "Fluent across the space; explains, generalizes, and evaluates approaches under constraints.",
    },
  },
];

const SKILL_BY_ID = new Map(SKILL_CATALOG.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return SKILL_BY_ID.get(id);
}

export function listSkills() {
  return SKILL_CATALOG.map(({ id, label, blurb }) => ({ id, label, blurb }));
}

export function buildSkillFocus(
  skillId: string,
  experience: Difficulty,
): string {
  const skill = getSkill(skillId);
  if (!skill) return "";

  const topicLines = skill.topics
    .map((t) => `- ${t.name}: ${t.subtopics.join(", ")}`)
    .join("\n");

  return [
    "\n# Interview focus\n",
    `This is a skill-specific practice interview on ${skill.label}. There is no resume to draw on — ` +
      "ground every question in the topic areas below, and calibrate depth to the stated seniority.",
    "",
    `Skill: ${skill.label}`,
    `What strong performance looks like at this level: ${skill.levelRubric[experience]}`,
    "",
    "Cover a representative spread across these topic areas over the interview, and probe subtopics with follow-ups:",
    topicLines,
  ].join("\n");
}
