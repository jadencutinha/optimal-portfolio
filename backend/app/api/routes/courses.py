from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_access, get_course_repository, get_current_user
from app.auth.gating import Access
from app.auth.repository import ProfileData
from app.education.content import get_course
from app.education.repository import CourseRepository
from app.education.service import (
    check_topic_answer,
    course_detail,
    course_summaries,
    exam_questions,
    grade_exam,
)
from app.schemas.education import (
    AnswerResult,
    AnswerSubmission,
    CourseDetail,
    CourseProgress,
    CourseSummary,
    ExamQuestion,
    ExamResultSchema,
    ExamSubmission,
    VerificationResult,
)

router = APIRouter(tags=["courses"])


@router.get("/verify/{credential_id}", response_model=VerificationResult)
async def verify_credential(
    credential_id: str,
    repository: CourseRepository = Depends(get_course_repository),
) -> VerificationResult:
    certificate = await repository.get_certificate_by_credential(credential_id)
    if certificate is None:
        return VerificationResult(valid=False)
    course = get_course(certificate.course_id)
    issued_to = await repository.get_profile_email(certificate.user_id)
    return VerificationResult(
        valid=True,
        course=course["title"] if course else certificate.course_id,
        issued_to=issued_to,
        issued_at=certificate.issued_at,
        credential_id=certificate.credential_id,
    )


def _course_or_404(course_id: str) -> dict:
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course


@router.get("/courses", response_model=list[CourseSummary])
async def list_courses(
    access: Access = Depends(get_access),
    repository: CourseRepository = Depends(get_course_repository),
) -> list[CourseSummary]:
    enrolled: set[str] = set()
    completed: set[str] = set()
    if access.user_id:
        enrolled = await repository.enrolled_courses(access.user_id)
        completed = await repository.completed_courses(access.user_id)
    return course_summaries(enrolled, completed)


@router.get("/courses/{course_id}", response_model=CourseDetail)
async def get_course_detail(course_id: str) -> CourseDetail:
    return course_detail(_course_or_404(course_id))


@router.post("/courses/{course_id}/enroll", response_model=CourseSummary)
async def enroll(
    course_id: str,
    user: ProfileData = Depends(get_current_user),
    repository: CourseRepository = Depends(get_course_repository),
) -> CourseSummary:
    course = _course_or_404(course_id)
    await repository.enroll(user.id, course_id)
    return CourseSummary(
        id=course["id"], title=course["title"], summary=course["summary"], topic_count=len(course["topics"]), enrolled=True
    )


@router.post("/courses/{course_id}/topics/{topic_id}/answer", response_model=AnswerResult)
async def answer_topic(
    course_id: str,
    topic_id: str,
    submission: AnswerSubmission,
    user: ProfileData = Depends(get_current_user),
    repository: CourseRepository = Depends(get_course_repository),
) -> AnswerResult:
    course = _course_or_404(course_id)
    result = check_topic_answer(course, topic_id, submission.choice)
    if result is None:
        raise HTTPException(status_code=404, detail="Topic not found.")
    if result.correct:
        await repository.complete_topic(user.id, course_id, topic_id)
    return result


@router.get("/courses/{course_id}/exam", response_model=list[ExamQuestion])
async def get_exam(
    course_id: str,
    user: ProfileData = Depends(get_current_user),
) -> list[ExamQuestion]:
    return exam_questions(_course_or_404(course_id))


@router.post("/courses/{course_id}/exam", response_model=ExamResultSchema)
async def submit_exam(
    course_id: str,
    submission: ExamSubmission,
    user: ProfileData = Depends(get_current_user),
    repository: CourseRepository = Depends(get_course_repository),
) -> ExamResultSchema:
    course = _course_or_404(course_id)
    score, total, percent, passed = grade_exam(course, submission.answers)
    await repository.save_exam(user.id, course_id, score, total, passed)
    credential_id = None
    if passed:
        certificate = await repository.issue_certificate(user.id, course_id)
        credential_id = certificate.credential_id
    return ExamResultSchema(score=score, total=total, percent=percent, passed=passed, credential_id=credential_id)


@router.get("/courses/{course_id}/progress", response_model=CourseProgress)
async def get_progress(
    course_id: str,
    user: ProfileData = Depends(get_current_user),
    repository: CourseRepository = Depends(get_course_repository),
) -> CourseProgress:
    course = _course_or_404(course_id)
    enrolled = await repository.is_enrolled(user.id, course_id)
    completed = await repository.completed_topics(user.id, course_id)
    certificate = await repository.get_certificate(user.id, course_id)
    return CourseProgress(
        course_id=course_id,
        enrolled=enrolled,
        completed_topics=completed,
        topic_count=len(course["topics"]),
        complete=certificate is not None,
        credential_id=certificate.credential_id if certificate else None,
    )
