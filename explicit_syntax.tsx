import { useState } from 'react'

type selectedTheme = 'light' | 'dark'

function ExplicitSyntaxDemo() {

  const [item, setItem] = useState<string[]>([])
  const [theme, setTheme] = useState<selectedTheme>('light')

}