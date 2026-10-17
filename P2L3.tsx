// Phase 2: Lesson 3 Typing Event Handlers & Form Submit
import React, {useState} from "react"

function SearchBox() {
  const [query, setQuery] = useState<string> ('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Searching for:', query)
  }

  return (
    <form  onSubmit={handleSearchSubmit}>
      <input type="text" value={query} onChange={handleInputChange} />
      <button type="submit">Search</button>
    </form>
  )
}
export default SearchBox()