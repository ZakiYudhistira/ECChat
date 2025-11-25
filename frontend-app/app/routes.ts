import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("welcome/welcome.tsx"),
    route("login", "login/login.tsx"),
    route("register", "register/register.tsx"),
    route("chat", "chat/chat.tsx"),
    route("home", "routes/home.tsx")
] satisfies RouteConfig;