import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useCourses } from '../api/queries'
import type { CourseSummary } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { CourseModule } from '../components/CourseModule'
import { FinalExam } from '../components/FinalExam'
import { displayName } from '../lib/displayName'

type View = { kind: 'catalog' } | { kind: 'module'; course: CourseSummary } | { kind: 'exam'; course: CourseSummary }

export function CoursePage() {
  const courses = useCourses()
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const [view, setView] = useState<View>({ kind: 'catalog' })
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState<CourseSummary | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  const learner = session ? displayName(session.user) : 'Learner'
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['courses'] })

  const enroll = async (course: CourseSummary) => {
    setEnrolling(true)
    await apiClient.post(`/api/courses/${course.id}/enroll`)
    setEnrolling(false)
    setConfirming(null)
    await refresh()
    setView({ kind: 'module', course })
  }

  if (view.kind === 'module') {
    return (
      <CourseModule
        courseId={view.course.id}
        onExam={() => setView({ kind: 'exam', course: view.course })}
        onBack={() => {
          refresh()
          setView({ kind: 'catalog' })
        }}
      />
    )
  }

  if (view.kind === 'exam') {
    return (
      <FinalExam
        courseId={view.course.id}
        courseTitle={view.course.title}
        learner={learner}
        onClose={() => {
          refresh()
          setView({ kind: 'catalog' })
        }}
      />
    )
  }

  const list = (courses.data ?? []).filter((course) =>
    `${course.title} ${course.summary}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="course-catalog">
      <h1>Courses</h1>
      <input
        className="course-search"
        placeholder="Search courses…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {courses.isLoading && <p className="muted">Loading courses…</p>}

      <div className="course-grid">
        {list.map((course) => (
          <div key={course.id} className={`course-card${course.completed ? ' completed' : ''}`}>
            {course.completed && <span className="course-badge">✓ Complete</span>}
            <h3>{course.title}</h3>
            <p className="muted">{course.summary}</p>
            <p className="course-meta">{course.topic_count} topics · final exam</p>
            {course.completed ? (
              <button className="primary" onClick={() => setView({ kind: 'module', course })}>
                Review
              </button>
            ) : course.enrolled ? (
              <button className="primary" onClick={() => setView({ kind: 'module', course })}>
                Continue
              </button>
            ) : (
              <button className="primary" onClick={() => setConfirming(course)}>
                Enroll
              </button>
            )}
          </div>
        ))}
        {!courses.isLoading && list.length === 0 && <p className="muted">No courses match your search.</p>}
      </div>

      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Enroll in {confirming.title}?</h2>
            <p className="modal-sub">
              {confirming.topic_count} topics and a final exam. You can start right away and earn a certificate at 90%.
            </p>
            <button className="primary" disabled={enrolling} onClick={() => enroll(confirming)}>
              {enrolling ? 'Enrolling…' : 'Confirm enrollment'}
            </button>
            <button type="button" className="modal-toggle" onClick={() => setConfirming(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
