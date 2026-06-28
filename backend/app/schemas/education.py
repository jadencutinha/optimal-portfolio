from datetime import datetime

from pydantic import BaseModel


class VerificationResult(BaseModel):
    valid: bool
    course: str | None = None
    issued_to: str | None = None
    issued_at: datetime | None = None
    credential_id: str | None = None


class CourseSummary(BaseModel):
    id: str
    title: str
    summary: str
    topic_count: int
    enrolled: bool = False
    completed: bool = False


class TopicQuiz(BaseModel):
    prompt: str
    options: list[str]


class Topic(BaseModel):
    id: str
    title: str
    body: list[dict]
    quiz: TopicQuiz


class ExamQuestion(BaseModel):
    id: str
    prompt: str
    options: list[str]


class CourseDetail(BaseModel):
    id: str
    title: str
    summary: str
    topics: list[Topic]
    exam_question_count: int


class AnswerSubmission(BaseModel):
    choice: int


class AnswerResult(BaseModel):
    correct: bool
    answer: int


class ExamSubmission(BaseModel):
    answers: dict[str, int]


class ExamResultSchema(BaseModel):
    score: int
    total: int
    percent: float
    passed: bool
    credential_id: str | None = None


class CourseProgress(BaseModel):
    course_id: str
    enrolled: bool
    completed_topics: list[str]
    topic_count: int
    complete: bool
    credential_id: str | None = None
