"""
Pydantic schema-lar. Fikir ayrılığı üçün qayda: "In" = client-dən gələn,
başqa suffiks yoxdursa = client-ə gedən cavab. password_hash kimi sahələr
HEÇ VAXT response schema-larında olmur — bu, təsadüfən parol hash-inin
API cavabında sızmasının qarşısını alan sadə amma vacib bir vərdişdir.
"""

from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- User / Stats ----------
class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str | None
    streak: int
    hp: int
    xp: int
    gems: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Lessons ----------
class LessonOut(BaseModel):
    id: str
    title: str
    emoji: str
    xp: int
    desc: str
    taskType: str
    type: str
    duration: int | None = None
    prompt: str | None = None


class LessonCompleteOut(BaseModel):
    lesson_id: str
    xp_awarded: int
    already_completed: bool
    user: UserOut


# ---------- Leaderboard ----------
class LeaderboardEntry(BaseModel):
    rank: int
    name: str | None
    xp: int
    streak: int


# ---------- Quest Submissions ----------
class QuestSubmitIn(BaseModel):
    """Frontend-dən gələn anket/quest tamamlama payload-u."""
    task_type: str                # breathe | mood | journal | timer | confirm | celebrate
    mood_value: int | None = None  # Yalnız taskType='mood' üçün: 1–5
    text_content: str | None = None  # Journal mətni / mood notu


class QuestSubmitOut(BaseModel):
    """Quest submission uğurlu kaydedildikten sonra döndürülen cavab."""
    id: int
    lesson_id: str
    task_type: str
    mood_value: int | None
    text_content: str | None
    submitted_at: datetime
    xp_awarded: int
    already_completed: bool
    user: UserOut

    model_config = {"from_attributes": True}


class QuestSubmissionHistoryItem(BaseModel):
    """GET /quests/my-submissions cavabındaki hər bir element."""
    id: int
    lesson_id: str
    task_type: str
    mood_value: int | None
    text_content: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}
