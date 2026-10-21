"use client";

/**
 * The value of one prop, as it can be edited in the UI.
 *
 * Only the *primitive* props are editable. A prop that holds a React
 * element (like `index.tsx`'s `age`) or an object cannot be typed into
 * a text field, so it is shown read-only.
 */
export type EditablePropValue = string | number | boolean;

type PlaygroundPropsEditorProps = {
  /** The props the playground would pass to the component. */
  props: Record<string, unknown>;
  /**
   * The values the learner has overridden.
   *
   * These win over the registry's own values.
   */
  overrides: Record<string, EditablePropValue>;
  /** Called when a value is changed. */
  onChange: (name: string, value: EditablePropValue) => void;
  /** Called when an override is removed. */
  onReset: (name: string) => void;
};

/**
 * Reads a prop as an editable value.
 *
 * Returns `null` for a value that cannot be edited — a React element,
 * an array or an object.
 */
function toEditableValue(value: unknown): EditablePropValue | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  return null;
}

/**
 * Lets the learner change the props the component is rendered with.
 *
 * The practice files take their props from a small registry (see
 * `lib/playground/registry.tsx`). This panel makes those values
 * editable, so the learner can see how the component behaves with
 * different input without touching the file.
 */
export function PlaygroundPropsEditor({
  props,
  overrides,
  onChange,
  onReset,
}: PlaygroundPropsEditorProps) {
  const names = Object.keys(props);

  if (names.length === 0) {
    return (
      <p className="text-[11px] leading-5 text-[var(--text-subtle)]">
        ဒီ component က props မလိုပါ။
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {names.map((name) => {
        const editable = toEditableValue(props[name]);
        const overridden = name in overrides;
        const value = overridden ? overrides[name] : editable;

        if (editable === null) {
          return (
            <li
              key={name}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="font-mono font-semibold text-[var(--text-muted)]">
                {name}
              </span>
              <span className="truncate text-[var(--text-subtle)]">
                read-only
              </span>
            </li>
          );
        }

        return (
          <li key={name} className="flex items-center gap-2">
            <label
              htmlFor={`prop-${name}`}
              className="w-24 shrink-0 truncate font-mono text-[11px] font-semibold text-[var(--text-muted)]"
            >
              {name}
            </label>

            {typeof value === "boolean" ? (
              <input
                id={`prop-${name}`}
                type="checkbox"
                checked={value}
                onChange={(event) =>
                  onChange(name, event.target.checked)
                }
                className="size-3.5 shrink-0 accent-[var(--accent)]"
              />
            ) : (
              <input
                id={`prop-${name}`}
                type="text"
                value={String(value)}
                onChange={(event) => {
                  const raw = event.target.value;

                  if (typeof editable === "number") {
                    const parsed = Number(raw);
                    onChange(name, Number.isNaN(parsed) ? raw : parsed);
                    return;
                  }

                  onChange(name, raw);
                }}
                className="min-w-0 flex-1 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1 font-mono text-[11px] text-[var(--text-strong)] outline-none transition-colors focus-visible:border-[var(--accent)]"
              />
            )}

            {overridden ? (
              <button
                type="button"
                onClick={() => onReset(name)}
                title={`${name} ကို မူလအတိုင်း ပြန်ထားမယ်`}
                aria-label={`${name} ကို ပြန်လည်သတ်မှတ်မယ်`}
                className="shrink-0 rounded-md border border-[var(--surface-border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                ↺
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
