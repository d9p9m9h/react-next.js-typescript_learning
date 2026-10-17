// Phase 2 — Lesson 7: Typing Component Props

type CourseCardProps = { title: string, durationMinute: number, instructor?: string }

function CourseCard(
  { title, durationMinute, instructor }: CourseCardProps
) {
  return (
    <article style={{background: '#e3e2e2da', textAlign: 'center'}}>
      <h2> {title} </h2>
      <p>Duration: {durationMinute}min </p>
      {instructor ? <p>{instructor}</p> : null}
    </article>
  )
}
export default CourseCard
