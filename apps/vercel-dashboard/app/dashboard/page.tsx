import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, isSessionValid } from "@/lib/auth";
import { getQaSource } from "@/lib/env";
import { listDashboardQaEntries } from "@/lib/qaSource";
import DashboardClient from "./DashboardClient";
import YamlDashboard from "./YamlDashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  if (getQaSource() === "yaml") {
    const entries = await listDashboardQaEntries();
    return <YamlDashboard entries={entries} />;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!isSessionValid(session)) {
    redirect("/login");
  }

  const entries = await listDashboardQaEntries();

  return <DashboardClient initialEntries={entries} />;
}
