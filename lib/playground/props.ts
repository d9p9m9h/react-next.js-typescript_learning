import { isValidElement, type ReactElement } from "react";

import type { PlaygroundElementSpec, PlaygroundPropValue } from "./protocol";

/**
 * Converts React props into the serialisable format the sandbox
 * understands.
 *
 * Props travel into the preview through `postMessage`, which uses the
 * structured clone algorithm. React elements cannot be cloned — they hold
 * functions and symbols — so they are described instead (see
 * `PlaygroundElementSpec` in `lib/playground/protocol.ts`) and rebuilt
 * inside the sandbox with `React.createElement`.
 */

/** Thrown when a prop cannot be represented in the serialisable format. */
export class UnsupportedPropError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedPropError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Describes a React element so the sandbox can rebuild it.
 *
 * Only intrinsic elements (a plain tag name such as `"p"`) can be
 * described: a composite element would need the component function
 * itself, which cannot cross the frame boundary.
 */
function serializeElement(
  element: ReactElement,
  path: string,
): PlaygroundElementSpec {
  const type = element.type;

  if (typeof type !== "string") {
    throw new UnsupportedPropError(
      `"${path}" က component element ကို preview ထဲကို ပို့လို့ မရပါ — ` +
      "HTML tag ကိုသာ သုံးလို့ရပါတယ်။",
    );
  }

  const props = element.props as Record<string, unknown>;
  const serializedProps: Record<string, PlaygroundPropValue> = {};
  let children: PlaygroundPropValue | undefined;
  let hasChildren = false;

  for (const key of Object.keys(props)) {
    // `key` and `ref` are not ordinary props and cannot be cloned.
    if (key === "key" || key === "ref") continue;

    if (key === "children") {
      children = serializeValue(props[key], `${path}.children`);
      hasChildren = true;
      continue;
    }

    serializedProps[key] = serializeValue(props[key], `${path}.${key}`);
  }

  const spec: PlaygroundElementSpec = { __element: type };

  if (Object.keys(serializedProps).length > 0) {
    spec.props = serializedProps;
  }

  if (hasChildren) {
    spec.children = children;
  }

  return spec;
}

/**
 * Converts one value into its serialisable form.
 *
 * @param path A human-readable location, used in error messages.
 */
export function serializeValue(value: unknown, path: string): PlaygroundPropValue {
  if (value === null) return null;

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return value;

    case "undefined":
      return null;

    case "function":
      throw new UnsupportedPropError(
        `"${path}" က function ဖြစ်တဲ့ prop ကို preview ထဲကို ပို့လို့ မရပါ — ` +
        "ကိုယ်ကိုယ်ရေးထားတဲ့ component အတွက်သာ အသုံးပြုပါ။",
      );

    case "bigint":
    case "symbol":
      throw new UnsupportedPropError(
        `"${path}" က ${typeof value} အမျိုးအစား prop ကို preview ထဲကို ပို့လို့ မရပါ။`,
      );

    default:
      break;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      serializeValue(item, `${path}[${index}]`),
    );
  }

  if (isValidElement(value)) {
    return serializeElement(value, path);
  }

  if (isPlainObject(value)) {
    const result: Record<string, PlaygroundPropValue> = {};

    for (const key of Object.keys(value)) {
      result[key] = serializeValue(value[key], `${path}.${key}`);
    }

    return result;
  }

  throw new UnsupportedPropError(
    `"${path}" က ${value.constructor?.name ?? "unknown"} အမျိုးအစား prop ကို preview ထဲကို ပို့လို့ မရပါ။`,
  );
}

/**
 * Converts a whole props object into the serialisable format.
 *
 * `undefined` props are dropped, because React treats an absent prop and
 * an `undefined` prop the same way.
 */
export function serializeProps(
  props: Record<string, unknown>,
): Record<string, PlaygroundPropValue> {
  const result: Record<string, PlaygroundPropValue> = {};

  for (const key of Object.keys(props)) {
    if (props[key] === undefined) continue;
    result[key] = serializeValue(props[key], key);
  }

  return result;
}
