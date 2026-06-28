import OpenAI from "openai";
import type { AssembledSources } from "../utils/AssembleProfile";
import z from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { prisma } from "../../prisma/db";

const baseUrl = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_SECRET_KEY;
const model = process.env.OPENAI_TTT_MODEL;

const openai = new OpenAI({
    baseURL: `${baseUrl}/openai/v1/`,
    apiKey: apiKey
});

const summarySchema = z.object({
    name: z.string(),
    role: z.string().nullable(),
    summary: z.string().nullable(),
    yearOfExp: z.literal(['fresher', '<1 year', '<3 year', '<5 year', '<10 year', '>= 10 year']).nullable(),
    email: z.string().nullable(),
    linkedIn: z.string().nullable(),
    github: z.string().nullable(),
    phone: z.string().nullable(),
    technicalSkills: z.array(z.object({
        name: z.string().nullable(),
        usedIn: z.array(z.string()).nullable(),
    })),
    experience: z.array(z.object({
        role: z.string().nullable(),
        company: z.string().nullable(),
        duration: z.string().nullable(),
        work: z.array(z.string()).nullable()
    })),
    projects: z.array(z.object({
        name: z.string().nullable(),
        skills: z.array(z.string()).nullable(),
        readmeSummary: z.array(z.string()).nullable(),
        about: z.array(z.string()).nullable(),
    })),
    education: z.array(z.object({
        qualification: z.string().nullable(),
        institution: z.string().nullable(),
        startingYear: z.string().nullable()
    }))
})

export async function getResumeSummary(data: AssembledSources) {
    const system = `You're a smart and very intelligent assistant. You will be asked to generate a structured summary output using the contents of an resume document.
    Here's an example of summarised structured output of a resume:
        {
            "name": "Aman Yadav",
            "role": "Full-Stack Engineer",
            "summary": "Full-Stack Engineer with expertise in designing, developing, and deploying scalable web applications. Strong background in modern frontend and backend technologies, cloud infrastructure, and performance optimization. Successfully reduced API response times by 50% and improved database query efficiency by 70% while building production-ready systems. Experienced in scalable architectures, real-time applications, and cloud-native development.",
            "yearOfExp": "<1 year",
            "email": "ay.work07@gmail.com",
            "linkedIn": "https://linkedin.com/in/devamanydv",
            "github": "https://github.com/dev-amanydv",
            "phone": "+91 8107595366",
            "technicalSkills": [
                {
                "name": "React",
                "usedIn": ["Crewbella Platform", "SyncSides"]
                },
                {
                "name": "Next.js",
                "usedIn": ["Crewbella Platform", "SyncSides"]
                },
                {
                "name": "TypeScript",
                "usedIn": ["Crewbella Platform", "SyncSides"]
                },
                {
                "name": "JavaScript"
                },
                {
                "name": "Node.js",
                "usedIn": ["Crewbella Platform", "SyncSides"]
                },
                {
                "name": "Express.js",
                "usedIn": ["Crewbella Platform"]
                },
                {
                "name": "WebRTC",
                "usedIn": ["SyncSides"]
                },
                {
                "name": "Socket.io",
                "usedIn": ["SyncSides"]
                },
                {
                "name": "PostgreSQL",
                "usedIn": ["SyncSides"]
                },
                {
                "name": "Prisma ORM"
                },
                {
                "name": "Redis",
                "usedIn": ["Crewbella Platform"]
                },
                {
                "name": "AWS",
                "usedIn": ["GSM Enterprises"]
                },
                {
                "name": "Azure"
                },
                {
                "name": "Docker"
                },
                {
                "name": "Cloudflare Workers"
                },
                {
                "name": "CI/CD"
                },
                {
                "name": "MongoDB"
                },
                {
                "name": "MySQL"
                },
                {
                "name": "FFmpeg",
                "usedIn": ["SyncSides"]
                },
                {
                "name": "Tailwind CSS",
                "usedIn": ["SyncSides"]
                },
                {
                "name": "Hono"
                },
                {
                "name": "REST APIs"
                },
                {
                "name": "Queues"
                },
                {
                "name": "JWT"
                },
                {
                "name": "NextAuth"
                },
                {
                "name": "OAuth"
                },
                {
                "name": "Zod"
                },
                {
                "name": "OpenAPI"
                },
                {
                "name": "Git"
                },
                {
                "name": "GitHub"
                },
                {
                "name": "Sentry",
                "usedIn": ["Crewbella Platform"]
                },
                {
                "name": "Razorpay",
                "usedIn": ["Crewbella Platform"]
                },
                {
                "name": "Meta WhatsApp Cloud API",
                "usedIn": ["Crewbella Platform"]
                },
                {
                "name": "SQL"
                },
                {
                "name": "C++"
                },
                {
                "name": "C"
                }
            ],
            "experience": [
                {
                "role": "Full-Stack Developer",
                "company": "Crewbella Ecosystems",
                "duration": "October 2025 - Present",
                "work": [
                    "Added Redis caching and Sentry monitoring to improve production reliability.",
                    "Built event creation, ticket booking, QR-based ticketing, and automated ticket delivery via email and WhatsApp.",
                    "Implemented Razorpay webhook verification for secure ticket assignment after successful payments.",
                    "Integrated Meta WhatsApp Cloud API for transactional messaging and document delivery.",
                    "Developed PDF/CSV export functionality for applicant data and automated document delivery through WhatsApp templates.",
                    "Rebuilding the Crewbella platform from scratch using Next.js and Express.js with a scalable architecture."
                ]
                },
                {
                "role": "Full-Stack Developer Intern",
                "company": "GSM Enterprises",
                "duration": "August 2025 - October 2025",
                "work": [
                    "Integrated a new provider into the production environment.",
                    "Developed serverless backend workflows using AWS Lambda.",
                    "Integrated backend APIs with the frontend application.",
                    "Fixed production bugs and improved application stability."
                ]
                }
            ],
            "projects": [
                {
                "name": "SyncSides",
                "skills": [
                    "TypeScript",
                    "Next.js",
                    "WebRTC",
                    "Socket.io",
                    "Node.js",
                    "PostgreSQL",
                    "FFmpeg"
                ],
                "readmeSummary": [
                    "Real-time meeting and recording platform with synchronized local recordings.",
                    "Supports low-latency peer-to-peer video collaboration.",
                    "Automates post-processing using FFmpeg."
                ],
                "about": [
                    "Built a full-stack video collaboration platform with real-time P2P streaming and synchronized recording.",
                    "Designed a low-latency WebRTC signaling architecture using Node.js and Socket.io.",
                    "Implemented chunk-based uploads supporting recordings larger than 1GB.",
                    "Automated server-side video merging using FFmpeg."
                ]
                }
            ],
            "education": [
                {
                "qualification": "Bachelor of Technology (Computer Science and Engineering)",
                "institution": "Government Engineering College, Ajmer",
                "startingYear": "2024"
                }
            ]
        }
    `
    const user = `Below is the extracted text content of an candiate resume: 
        rawText: ${data.rawResumeText},
        githubSources: ${data.githubSources},
        siteSources: ${data.siteSources}.
    `

    try {
        const response = await openai.responses.create({
            model: model,
            input: [
                {
                    role: 'system', content: system
                },
                {
                    role: 'user', content: user
                }
            ],
            text: {
                format: zodTextFormat(summarySchema, 'userData')
            }
        });
        return response.output_text ? JSON.parse(response.output_text) : null
    } catch (error) {
        console.log(error);
        return null
    }
}