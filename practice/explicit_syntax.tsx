import { useState } from 'react'

type selectedTheme = 'light' | 'dark'

function ExplicitSyntaxDemo() {

  const [item, setItem] = useState<string[]>([])
  const [theme, setTheme] = useState<selectedTheme>('light')

  return (
    <>
      <h2>Explicit Syntax Demo</h2>
      <p>Theme: {theme}</p>
      <ul>
        {item.map((value, index) => (
          <li key={index}>{value}</li>
        ))}
      </ul>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </button>
    </>
  )
}