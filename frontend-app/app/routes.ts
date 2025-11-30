import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("welcome/welcome.tsx"),
    route("login", "login/login.tsx"),
    route("register", "register/register.tsx"),
    route("home", "routes/home.tsx"),
    route("test", "test/test.tsx"),

    layout("./routes/protected.tsx", [
        route("chat", "chat/chat.tsx")
    ])
] satisfies RouteConfig;