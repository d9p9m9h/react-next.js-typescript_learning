// Phase 2 - Lesson 6: React Event Handlers

'use client'
import { type ChangeEvent, useState } from "react"

function NameInput() {
  const [name, setName] = useState('')

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.currentTarget.value)
  }

  return (
    <>
      <input type="text" value={name} onChange={handleNameChange} />
      <p> {name} </p>
    </>
  )
}
export default NameInput
