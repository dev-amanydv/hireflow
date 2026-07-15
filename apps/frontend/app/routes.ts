import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx", [
        index("routes/dashboard/index.tsx"),
        route("overview", "routes/dashboard/overview.tsx"),
        route("practice", "routes/dashboard/practice.tsx"),
        route("practice/:skillId", "routes/dashboard/practice-detail.tsx"),
        route("jobs", "routes/dashboard/jobs.tsx"),
        route("interviews", "routes/dashboard/interviews.tsx"),
        route("interviews/:interviewId/result", "routes/dashboard/interview-result.tsx"),
        route("resume", "routes/dashboard/resume.tsx"),
        route("insights", "routes/dashboard/insights.tsx"),
        route("profile", "routes/dashboard/profile.tsx"),
        route("settings", "routes/dashboard/settings.tsx"),
    ]),
    route("start", "routes/start.tsx"),
    route("interview/:id", "routes/interview.tsx"),
    route("result", "routes/result.tsx"),
    route("u/:username", "routes/profile-public.tsx"),
    route("u/:username/i/:interviewId", "routes/public-interview.tsx"),
] satisfies RouteConfig;
