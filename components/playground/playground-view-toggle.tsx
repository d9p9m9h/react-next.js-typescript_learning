"use client";

/** Which of the two panels the playground is currently showing. */
export type PlaygroundView = "code" | "preview";

type PlaygroundViewToggleProps = {
  /** The panel that is currently visible. */
  value: PlaygroundView;
  /** Called when the learner picks the other panel. */
  onChange: (view: PlaygroundView) => void;
};

const OPTIONS: { value: PlaygroundView; label: string; icon: string }[] = [
  { value: "code", label: "Code", icon: "⌨" },
  { value: "preview", label: "Preview", icon: "▷" },
];

/**
 * Switches between the code editor and the live preview.
 *
 * The playground shows **one** panel at a time: the editor and the
 * preview take turns instead of sitting side by side. On a narrow
 * screen there is not enough room for two columns anyway, and on a wide
 * screen a single full-width panel is much easier to read and to type
 * into.
 */
export function PlaygroundViewToggle({
  value,
  onChange,
}: PlaygroundViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Code နဲ့ Preview ပြန်ချင်းပြောင်းမယ်"
      className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)] p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            title={`${option.label} ကို ပြမယ်`}
            className={[
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
              isActive
                ? "bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-subtle)] hover:text-[var(--text-strong)]",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-xs leading-none">
              {option.icon}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
