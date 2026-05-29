import Script from "next/script";

export default function AssistantPreviewPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8">
      <div className="mb-5 border-b border-line pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Preview</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Tenant Q&A Assistant</h1>
      </div>
      <div id="tenant-qa-assistant" />
      <Script src="/embed/assistant.js" strategy="afterInteractive" />
    </main>
  );
}
