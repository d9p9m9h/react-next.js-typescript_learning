import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Myanmar } from "next/font/google";
import type { ReactNode } from "react";

import { LabShell } from "@/components/lab-shell";
import { ProgressProvider } from "@/components/progress-store";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});

const myanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-myanmar",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "React Learning Lab",
    template: "%s | React Learning Lab",
  },
  description:
    "A hands-on workspace for learning React, TypeScript, and Next.js.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#111a18" },
  ],
};

/**
 * Applies the stored theme before paint so the page never flashes the wrong
 * colour scheme. Kept inline and synchronous on purpose.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("react-lab-theme");
    var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="my"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} ${myanmar.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.className} ${mono.className} font-sans`}
        style={{ fontFamily: "var(--font-inter), var(--font-myanmar), sans-serif" }}
      >
        <ThemeProvider>
          <ProgressProvider>
            <LabShell>{children}</LabShell>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
