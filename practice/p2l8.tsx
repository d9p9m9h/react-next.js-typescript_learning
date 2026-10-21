// Phase 2 - Lesson 8: Typing Children Props

import type { ReactNode } from "react"

type NoticProps = {
  title: string;
  children: ReactNode;
}

function Notic({ title, children }: NoticProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-950 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800">
      <h2 className="text-2xl font-bold text-gold-800 dark:text-gold-400 mb-2">
        {title}
      </h2>
      <div className="text-gold-600 dark:text-gold-400">
        {children}
      </div>
    </div>
  )
}

function NoticShow() {
  return (
    <Notic title="Imported">
      <p>Imported Message!</p>
    </Notic>
  )
}
export default NoticShow