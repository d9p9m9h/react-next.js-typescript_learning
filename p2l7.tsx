// Phase 2 — Lesson 7: Typing Component Props
// Phase 2 — Lesson 7: Extend Section: type & interface


// type CourseCardProps = { 
//   title: string, 
//   durationMinute: number, 
//   instructor?: string }

interface CourseCardProps {
  title: string,
  durationMinutes: number,
  instructor?: string
}


function CourseCard(
  { title, durationMinutes, instructor }: CourseCardProps
) {
  return (
    <article style={{ background: '#e3e2e2da', textAlign: 'center' }}>
      <h2> {title} </h2>
      <p>Duration: {durationMinutes} </p>
      {instructor ? <p>{instructor}</p> : null}
    </article>
  )
}

export default CourseCard

// Phase 2 — Lesson 7: Extend Section: Union Type

type Theme = 'light' | 'dark'
type ThemeProps = {
  theme: Theme
}

function CurrentTheme({ theme }: ThemeProps) {

  if (theme === 'light') {
    return <h2>Light Theme</h2>
  }
  if (theme === 'dark') {
    return <h2>Dark Theme</h2>
  }
  return <h1>Something went wrong</h1>
}