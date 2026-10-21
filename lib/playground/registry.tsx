/**
 * Which component inside each playground file should be rendered.
 *
 * The learner's root-level `.tsx` files are practice files: most of them
 * export a component, but some only define one locally (`index.tsx`,
 * `P2L4.tsx`, `explicit_syntax.tsx`, `event_handler.tsx`).
 *
 * The learner's own files are never modified. Instead the playground keeps
 * a small registry that says "when this file is open, render this
 * component" and supplies the props it needs.
 */
export type PlaygroundTarget = {
  /** The component to render. `"default"` means the file's default export. */
  component: string;
  /** Props handed to the component. */
  props?: Record<string, unknown>;
  /** Optional short label shown in the UI. */
  label?: string;
};

/**
 * Keys are the exact file name as it appears on disk.
 *
 * The registry is deliberately explicit so the learner can see, in one
 * place, which component each practice file is expected to show.
 */
export const playgroundTargets: Record<string, PlaygroundTarget> = {
  "P2L3.tsx": {
    component: "default",
    props: {},
    label: "SearchBox",
  },
  "P2L4.tsx": {
    component: "UserList",
    props: {},
    label: "UserList",
  },
  "event_handler.tsx": {
    // This file is entirely commented out — there is no component to
    // render yet, so the playground shows the source with a note instead.
    component: "none",
    props: {},
    label: "commented out",
  },
  "explicit_syntax.tsx": {
    component: "ExplicitSyntaxDemo",
    props: {},
    label: "ExplicitSyntaxDemo",
  },
  "index.tsx": {
    component: "UserProfile",
    props: {
      name: "Mingalarpar",
      age: <p>28</p>,
      isOnline: "Online",
    },
    label: "UserProfile",
  },
  "p2l5.tsx": {
    component: "default",
    props: {},
    label: "ProfileEditor",
  },
  "p2l6.tsx": {
    component: "default",
    props: {},
    label: "NameInput",
  },
  "p2l7.tsx": {
    component: "default",
    props: {
      title: "Mingalarpar",
      durationMinutes: 60,
      instructor: "Deparminhtet",
    },
    label: "CourseCard",
  },
};

/** The file shown first when the playground opens. */
export const defaultPlaygroundFile = "P2L3.tsx";
