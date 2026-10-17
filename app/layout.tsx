import type { Metadata } from 'next'

// Browser Tab မှာ ပြသမည့် Title နှင့် SEO Metadata
export const metadata: Metadata = {
  title: 'Modern Fronend Learning',
  description: 'Learning React, Next.js, TypeScript, TailwindCSS', 
}

// Root Layout Component
export default function RootLayout(
  { children,}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#111111' }}>
        {/* Navigation Bar သို့မဟုတ် Header ကို ဒီနေရာမှာ ထည့်နိုင်ပါတယ် */}

        <main>
          {children}
        </main>

        {/* Footer ကို ဒီနေရာမှာ ထည့်နိုင်ပါတယ် */}
      </body>
    </html>
  )
}