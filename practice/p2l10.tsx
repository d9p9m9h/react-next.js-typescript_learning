// Phase 2 - Lessons 10: React useState နဲ့ Input Events

'use client'

import { useState } from 'react'

function ProductNameField() {
  const [name, setName] = useState('')

  return (
    <section>
      <label>
        Product name
        <input value={name} onChange={(event) => {
          setName(event.target.value);
        }} />
      </label>

      <p>Product: {name || 'No name yet !'}</p>
    </section>
  )
}
export default ProductNameField