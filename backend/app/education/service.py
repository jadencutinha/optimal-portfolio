from app.education.content import COURSES, PASS_THRESHOLD
from app.schemas.education import (
    AnswerResult,
    CourseDetail,
    CourseSummary,
    ExamQuestion,
    Topic,
    TopicQuiz,
)


def course_summaries(enrolled: set[str], completed: set[str]) -> list[CourseSummary]:
    return [
        CourseSummary(
            id=course["id"],
            title=course["title"],
            summary=course["summary"],
            topic_count=len(course["topics"]),
            enrolled=course["id"] in enrolled,
            completed=course["id"] in completed,
        )
        for course in COURSES
    ]


def course_detail(course: dict) -> CourseDetail:
    topics = [
        Topic(
            id=topic["id"],
            title=topic["title"],
            body=topic["body"],
            quiz=TopicQuiz(prompt=topic["quiz"]["prompt"], options=topic["quiz"]["options"]),
        )
        for topic in course["topics"]
    ]
    return CourseDetail(
        id=course["id"],
        title=course["title"],
        summary=course["summary"],
        topics=topics,
        exam_question_count=len(course["final_exam"]),
    )


def check_topic_answer(course: dict, topic_id: str, choice: int) -> AnswerResult | None:
    topic = next((item for item in course["topics"] if item["id"] == topic_id), None)
    if topic is None:
        return None
    answer = topic["quiz"]["answer"]
    return AnswerResult(correct=choice == answer, answer=answer)


def exam_questions(course: dict) -> list[ExamQuestion]:
    return [
        ExamQuestion(id=question["id"], prompt=question["prompt"], options=question["options"])
        for question in course["final_exam"]
    ]


def grade_exam(course: dict, answers: dict[str, int]) -> tuple[int, int, float, bool]:
    exam = course["final_exam"]
    total = len(exam)
    score = sum(1 for question in exam if answers.get(question["id"]) == question["answer"])
    percent = score / total if total else 0.0
    return score, total, percent, percent >= PASS_THRESHOLD
