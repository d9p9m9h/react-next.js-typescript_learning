import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      /**
       * The playground serves the raw *source* of every root-level `.tsx`
       * file so the editor can show (and edit) the learner's own code.
       *
       * The `?raw` condition keeps this rule away from ordinary `.tsx`
       * imports, which must still be compiled as React components.
       */
      "*.tsx": {
        condition: { query: "?raw" },
        type: "text",
      },
    },
  },
};

export default nextConfig;
