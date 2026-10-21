"use client";

/** Which editor and preview panels the playground is currently showing. */
export type PlaygroundView = "split" | "code" | "preview";

type PlaygroundViewToggleProps = {
  /** The panel that is currently visible. */
  value: PlaygroundView;
  /** Called when the learner picks the other panel. */
  onChange: (view: PlaygroundView) => void;
};

const OPTIONS: {
  value: PlaygroundView;
  label: string;
  icon: string;
  desktopOnly?: boolean;
}[] = [
  { value: "split", label: "Split", icon: "◫", desktopOnly: true },
  { value: "code", label: "Code", icon: "⌨" },
  { value: "preview", label: "Preview", icon: "▷" },
];

/**
 * Switches between the editor, the live preview, and a side-by-side view.
 */
export function PlaygroundViewToggle({
  value,
  onChange,
}: PlaygroundViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Code နဲ့ Preview မြင်ကွင်းရွေးမယ်"
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
            title={
              option.value === "split"
                ? "Code နဲ့ Preview ကို ဘေးချင်းယှဉ်ပြမယ်"
                : `${option.label} ကို ပြမယ်`
            }
            className={[
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
              option.desktopOnly ? "hidden lg:flex" : "",
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
