"use client";

import { useMemo, useState } from "react";
import type { QaEntry } from "@/lib/types";

type FormState = {
  id: number | null;
  question: string;
  answer: string;
  tags: string;
  active: boolean;
  sortOrder: number;
};

const emptyForm: FormState = {
  id: null,
  question: "",
  answer: "",
  tags: "",
  active: true,
  sortOrder: 0
};

function entryToForm(entry: QaEntry): FormState {
  return {
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    tags: entry.tags.join(", "),
    active: entry.active,
    sortOrder: entry.sortOrder
  };
}

export default function DashboardClient({ initialEntries }: { initialEntries: QaEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState("");
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id), [entries]);

  async function saveEntry() {
    setStatus("Saving...");
    const payload = {
      question: form.question,
      answer: form.answer,
      tags: form.tags,
      active: form.active,
      sortOrder: Number(form.sortOrder)
    };
    const response = await fetch(form.id ? `/api/admin/qa/${form.id}` : "/api/admin/qa", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Save failed.");
      return;
    }

    const saved = (await response.json()) as QaEntry;
    setEntries((current) => {
      const exists = current.some((entry) => entry.id === saved.id);
      return exists ? current.map((entry) => (entry.id === saved.id ? saved : entry)) : [...current, saved];
    });
    setForm(entryToForm(saved));
    setStatus("Saved.");
  }

  async function deleteEntry(id: number) {
    if (!window.confirm("Delete this Q&A entry?")) {
      return;
    }

    const response = await fetch(`/api/admin/qa/${id}`, { method: "DELETE" });

    if (response.ok) {
      setEntries((current) => current.filter((entry) => entry.id !== id));
      if (form.id === id) {
        setForm(emptyForm);
      }
      setStatus("Deleted.");
    } else {
      setStatus("Delete failed.");
    }
  }

  async function toggleActive(entry: QaEntry) {
    const response = await fetch(`/api/admin/qa/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: entry.question,
        answer: entry.answer,
        tags: entry.tags,
        active: !entry.active,
        sortOrder: entry.sortOrder
      })
    });

    if (response.ok) {
      const updated = (await response.json()) as QaEntry;
      setEntries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setStatus(updated.active ? "Activated." : "Deactivated.");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-6">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Q&A Entries</h2>
            <button className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white" onClick={() => setForm(emptyForm)} type="button">
              New Entry
            </button>
          </div>
          <div className="overflow-hidden rounded-md border border-line bg-panel">
            {sortedEntries.length === 0 ? (
              <p className="p-5 text-sm text-slate-600">No entries yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {sortedEntries.map((entry) => (
                  <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]" key={entry.id}>
                    <button className="min-w-0 text-left" onClick={() => setForm(entryToForm(entry))} type="button">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{entry.question}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${entry.active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
                          {entry.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{entry.answer}</p>
                      {entry.tags.length ? <p className="mt-2 text-xs text-slate-500">{entry.tags.join(", ")}</p> : null}
                    </button>
                    <div className="flex items-start gap-2">
                      <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink" onClick={() => toggleActive(entry)} type="button">
                        {entry.active ? "Disable" : "Enable"}
                      </button>
                      <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => deleteEntry(entry.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="rounded-md border border-line bg-panel p-4 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">{form.id ? "Edit Entry" : "New Entry"}</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Question</span>
              <input
                className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
                value={form.question}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Approved Answer</span>
              <textarea
                className="mt-2 h-40 w-full resize-y rounded-md border border-line px-3 py-2 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
                value={form.answer}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Tags</span>
              <input
                className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                value={form.tags}
              />
            </label>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="sortOrder">
                Sort Order
              </label>
              <input
                className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                id="sortOrder"
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                type="number"
                value={form.sortOrder}
              />
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                checked={form.active}
                className="h-4 w-4"
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                type="checkbox"
              />
              Active
            </label>
            <div className="flex items-center gap-3">
              <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white" onClick={saveEntry} type="button">
                Save
              </button>
              <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink" onClick={() => setForm(emptyForm)} type="button">
                Clear
              </button>
              <p className="text-sm text-slate-600">{status}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
