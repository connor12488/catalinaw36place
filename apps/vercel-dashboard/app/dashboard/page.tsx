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
    const entries = await safeListDashboardQaEntries();

    if ("error" in entries) {
      return <DashboardLoadError qaSource="yaml" error={entries.error} />;
    }

    return <YamlDashboard entries={entries} />;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!isSessionValid(session)) {
    redirect("/login");
  }

  const entries = await safeListDashboardQaEntries();

  if ("error" in entries) {
    return <DashboardLoadError qaSource="db" error={entries.error} />;
  }

  return <DashboardClient initialEntries={entries} />;
}

async function safeListDashboardQaEntries() {
  try {
    return await listDashboardQaEntries();
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown dashboard load error.";
}

function DashboardLoadError({ qaSource, error }: { qaSource: "yaml" | "db"; error: string }) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catalina West 36 Place</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Tenant Q&A Dashboard</h1>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink" type="submit">
            Sign Out
          </button>
        </form>
      </header>

      <section className="mt-6 rounded-md border border-red-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Dashboard could not load Q&A entries</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">Check the {qaSource === "db" ? "database setup" : "YAML file"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The login succeeded, but the dashboard hit an error while loading entries from{" "}
          <span className="font-semibold text-ink">{qaSource}</span>.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</pre>

        {qaSource === "db" ? (
          <div className="mt-5 rounded-md border border-line bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-ink">Quick checks</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Set Vercel env var <code>QA_SOURCE=db</code>.</li>
              <li>Set Vercel env var <code>DATABASE_URL</code> or <code>POSTGRES_URL</code> from Neon or Supabase.</li>
              <li>Run <code>python3 scripts/populate_qa_entries.py</code> from the repo root to create and seed <code>qa_entries</code>.</li>
              <li>Open <code>/api/health</code> and confirm it returns <code>qaSource: "db"</code> with a Q&A count.</li>
            </ol>
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-line bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-ink">Quick checks</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Confirm <code>qa/rental-qa.yaml</code> exists in the deployed branch.</li>
              <li>Check the YAML syntax, then redeploy Vercel.</li>
              <li>Open <code>/api/health</code> and confirm it returns <code>qaSource: "yaml"</code> with a Q&A count.</li>
            </ol>
          </div>
        )}
      </section>
    </main>
  );
}
