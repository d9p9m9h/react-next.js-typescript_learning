import React from 'react';

interface setType {
  name: string
  age: React.ReactElement
  isOnline: string
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