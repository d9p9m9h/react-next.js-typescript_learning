"use client";

/**
 * The device widths the preview can be shown at.
 *
 * `null` means "fill the panel". The fixed widths match the CSS
 * breakpoints a learner is likely to meet: a phone, a large phone, a
 * tablet and a small laptop.
 */
export const PREVIEW_WIDTHS: {
  value: number | null;
  label: string;
  icon: string;
}[] = [
  { value: null, label: "Full", icon: "▭" },
  { value: 390, label: "Phone", icon: "▯" },
  { value: 768, label: "Tablet", icon: "▤" },
  { value: 1280, label: "Laptop", icon: "▦" },
];

type PlaygroundWidthToggleProps = {
  /** The width the preview is currently shown at. */
  value: number | null;
  /** Called when the learner picks another width. */
  onChange: (width: number | null) => void;
};

/**
 * Lets the learner see the component at a different width.
 *
 * Responsive layouts are one of the things that are hard to reason
 * about in a plain code editor, so the preview can be narrowed to a
 * phone or a tablet without leaving the page.
 */
export function PlaygroundWidthToggle({
  value,
  onChange,
}: PlaygroundWidthToggleProps) {
  return (
    <div
      role="group"
      aria-label="Preview ကို ပြမည့် အကျဉ်း"
      className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)] p-1"
    >
      {PREVIEW_WIDTHS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            title={
              option.value === null
                ? "Preview ကို နေရာအပြည့် ပြမယ်"
                : `${option.value}px အကျဉ်းနဲ့ ပြမယ်`
            }
            className={[
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
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
