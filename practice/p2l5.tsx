// Phase 2 — Lesson 5: Typing React Hooks 
'use client'
import { useState } from "react"

type status = 'Depar' | 'Deparminhtet'

function ProfileEditor() {
  const [username, setUsername] = useState<status | null> (null)

  return(
    <>
      {/* ?? Nullish Coalescing Operator */}
      <h1> {username ?? 'No User Loaded'} </h1> <br />

      <button onClick={() => setUsername('Depar') }>Load Demo User</button>  
      <button onClick={() => setUsername(null)}> Clear </button>
    </>
  )
}
export default ProfileEditor