import React from 'react';

interface setType {
  name: string
  age: number
  isOnline: boolean
  children: React.ReactNode
}

function UserProfile
  ({ name, age, isOnline, children }: setType) {

  return (
    <>
      <h2> {name} {isOnline ? 'Online' : 'Offline'} </h2>
      {age && <p>Age: {age}</p>}
      <div> {children} </div>
    </>
  )
}