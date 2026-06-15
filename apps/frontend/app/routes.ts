import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"),
    route("form", "./routes/form.tsx"),
    route("interview", "routes/interview.tsx"),
    route("result", "./routes/result.tsx"),
    route("dashboard", "./routes/dashboard.tsx")
] satisfies RouteConfig;
