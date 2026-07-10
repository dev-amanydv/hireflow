import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("start", "routes/start.tsx"),
    route("interview/:id", "routes/interview.tsx"),
    route("result", "routes/result.tsx"),
] satisfies RouteConfig;
