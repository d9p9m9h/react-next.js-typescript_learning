// import ProfileEditor from '../p2l5'
// import NameInput from '../p2l6'
import CourseCard from '../p2l7'

export default function HomePage() {
  return (
    <main style={{ flexDirection: 'row', margin: 'auto', maxWidth: '180px', padding: '20px' }}>
      <CourseCard title='Mingalarpar' durationMinutes={60} instructor='Deparminhtet' />
    </main>
  )
}