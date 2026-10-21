import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tailwindcss/postcss", "@tailwindcss/oxide"],
  turbopack: {
    rules: {
      /**
       * The playground serves the raw *source* of every practice `.tsx`
       * file (in `practice/`) so the editor can show (and edit) the
       * learner's own code.
       *
       * The `?raw` condition keeps this rule away from ordinary `.tsx`
       * imports, which must still be compiled as React components.
       *
       * The glob has no `/` in it, so Turbopack matches it against the
       * **file name** — which means it also covers files in
       * sub-directories such as `practice/`.
       */
      "*.tsx": {
        condition: { query: "?raw" },
        type: "text",
      },
    },
  },
};

export default nextConfig;
