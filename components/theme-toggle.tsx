"use client";

import { useTheme, type Theme } from "@/components/theme-provider";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "system", label: "System", icon: "⌘" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, resolvedTheme, setTheme, toggle } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        className="flex size-9 items-center justify-center rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-[var(--text-muted)] transition-colors hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)]"
      >
        <span aria-hidden="true" className="text-sm">
          {resolvedTheme === "dark" ? "☀" : "☾"}
        </span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex items-center gap-1 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)] p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={isActive}
            title={option.label}
            className={[
              "flex size-8 items-center justify-center rounded-lg text-xs transition-colors",
              isActive
                ? "bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-subtle)] hover:text-[var(--text-strong)]",
            ].join(" ")}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
