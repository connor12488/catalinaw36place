import type { QaEntry } from "@/lib/types";

export default function YamlDashboard({ entries }: { entries: QaEntry[] }) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-6">
      <header className="border-b border-line pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catalina West 36 Place</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Tenant Q&A</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Current source: <span className="font-semibold text-ink">qa/rental-qa.yaml</span>. Edit the YAML file and redeploy
          Vercel to publish changes.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">{entries.length} approved Q&A entries</h2>
        </div>
        <ul className="divide-y divide-line">
          {entries.map((entry) => (
            <li className="p-4" key={entry.sourceKey || entry.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{entry.question}</p>
                {entry.sourceKey ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {entry.sourceKey}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{entry.answer}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
