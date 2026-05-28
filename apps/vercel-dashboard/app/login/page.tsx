type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = error === "config" ? "Login server configuration is incomplete. Check SESSION_SECRET." : "Invalid password.";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <section className="rounded-md border border-line bg-panel p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Tenant Q&A</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Admin Login</h1>
        <form action="/api/admin/login" className="mt-6 space-y-4" method="post">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-line px-3 py-2 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              name="password"
              required
              type="password"
            />
          </label>
          {error ? <p className="text-sm font-medium text-red-700">{errorMessage}</p> : null}
          <button className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white" type="submit">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
