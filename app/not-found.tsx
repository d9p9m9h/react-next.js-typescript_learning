import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-sm text-[var(--text-subtle)]">404</p>
      <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">
        Page not found
      </h1>
      <p className="max-w-sm text-sm leading-7 text-[var(--text-muted)]">
        ဒီ page က မရှိတော့ဘူး။ Playground ဆက်သွားပါ။
      </p>
      <Link
        href="/"
        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90"
      >
        Playground သို့
      </Link>
    </div>
  );
}
