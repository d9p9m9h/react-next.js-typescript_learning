// Phase 2: Lesson 4 — Modeling UI States with Discriminated Unions

import React, { useState } from "react";

// 1. State တစ်ခုစီအတွက် Discriminated Union Types သတ်မှတ်ခြင်း
type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: string }

// 2. Component အတွင်း အသုံးပြုပုံ
function UserList() {
  const [state, setState] = useState<FetchState>({ status: 'idle' })

  if (state.status === 'loading') {
    return <p>Loading...</p>
  }

  if (state.status === 'error') {
    // state.status === 'error' ဖြစ်ချိန်တွင်သာ state.error ကို သုံးခွင့်ပေးသည် (Type Narrowing)
    return <p>Error: {state.error}</p>
  }

  if (state.status === 'success') {
    // state.status === 'success' ဖြစ်ချိန်တွင်သာ state.data ကို သုံးခွင့်ပေးသည်
    return (
      <ul>
        {state.data.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <button onClick={() => setState({ status: 'loading' })}> Fetch </button>
  )
}

type FetchUser =
  | { status: 'logging in' }
  | { status: 'logged out' }
  | { status: 'logged in'; username: string, email: string }

function UserStatus() {
  const [users, setUsers] = useState<FetchUser>({ status: 'logging in' })

  if (users.status === 'logging in') {
    return (
      <form >
        <input type="text" name="username" placeholder="Username" />
        <input type="text" name="email" placeholder="Email" />

        <button type="submit"> Login </button>
      </form>
    )
  }

  if (users.status === 'logged in') {
    return (
      <form onSubmit={userSubmit}>
        <input type="text" value={users.username} onChange={userInputChange} />
        <input type="email" value={users.email} onChange={userInputChange} />
        <button type="submit">Login</button>
      </form>
    )
  }

  return (
        
    )

}