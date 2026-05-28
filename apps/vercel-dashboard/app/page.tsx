import Link from "next/link";
import { getQaSource } from "@/lib/env";

export default function HomePage() {
  const qaSource = getQaSource();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
      <div className="border-b border-line pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catalina West 36 Place</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Tenant Q&A</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Approved answers are served from {qaSource === "yaml" ? "qa/rental-qa.yaml" : "Postgres"} and embedded on the
          public rental website.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white" href="/dashboard">
          Q&A Dashboard
        </Link>
        <Link className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink" href="/assistant">
          Assistant Preview
        </Link>
      </div>
    </main>
  );
}
