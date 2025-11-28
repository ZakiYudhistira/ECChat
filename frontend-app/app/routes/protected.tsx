import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/protected";
import { isAuthenticated } from "../helpers/storage";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  if (!isAuthenticated()) {
    throw redirect("/login");
  }
  return null;
}

export default function ProtectedLayout() {
  return <Outlet />;
}