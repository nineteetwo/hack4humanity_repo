"""
ORM modelləri. Diqqət: frontend-dəki localStorage sahələri (streak, hp,
xp, gems) burada User cədvəlinin sütunlarıdır — indi "həqiqət mənbəyi"
(source of truth) server-dir, brauzer deyil. Bu, istənilən istifadəçinin
DevTools açıb localStorage-u əl ilə dəyişərək XP/gems "hack" etməsinin
qarşısını alır.
"""

import enum
from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, DateTime, Date, ForeignKey, UniqueConstraint, Enum, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- Game stats (əvvəllər StatsPanel-də localStorage-da idi) ---
    streak = Column(Integer, default=0)
    hp = Column(Integer, default=5)
    xp = Column(Integer, default=0)
    gems = Column(Integer, default=0)
    last_streak_date = Column(Date, nullable=True)  # streak-i gündə 1 dəfə artırmaq üçün

    progress = relationship("LessonProgress", back_populates="user", cascade="all, delete-orphan")
    quest_submissions = relationship("QuestSubmission", back_populates="user", cascade="all, delete-orphan")

    # Following relationships
    following = relationship(
        "Friend",
        foreign_keys="[Friend.user_id]",
        back_populates="user",
        cascade="all, delete-orphan"
    )

class Friend(Base):
    """
    Many-to-many friendship (one-way follow for simplicity).
    user_id follows friend_id.
    """
    __tablename__ = "friends"
    __table_args__ = (UniqueConstraint("user_id", "friend_id", name="uq_user_friend"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="following")
    friend_user = relationship("User", foreign_keys=[friend_id])


class LessonProgress(Base):
    """Hansı user hansı lesson-u nə vaxt bitirib. Bir user eyni lesson-u
    ikinci dəfə 'complete' etsə, XP TƏKRAR verilmir (server-side idempotency)."""
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(String, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")


class QuestSubmission(Base):
    """
    Kullanıcının anket/quest tamamlama sırasında yaptığı seçimleri saklar.
    Mood check-in'den seçilen emoji değeri, journal'dan yazılan metin,
    breathing/timer/confirm tamamlamaları buraya kaydedilir.
    Bir kullanıcı aynı lesson'ı tekrar tamamlasa bile her seferinde
    yeni bir submission kaydı oluşur (geçmiş tutulur).
    """
    __tablename__ = "quest_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(String, nullable=False, index=True)
    task_type = Column(String, nullable=False)  # breathe | mood | journal | timer | confirm | celebrate

    # Mood check-in: 1 (Very Low) → 5 (Great). Diğer task type'larda NULL.
    mood_value = Column(Integer, nullable=True)

    # Journal metni veya mood notu. Diğer task type'larda NULL.
    text_content = Column(Text, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quest_submissions")


class ChessGameStatus(str, enum.Enum):
    waiting = "waiting"
    active = "active"
    finished = "finished"


class ChessGame(Base):
    """Real-time multiplayer şahmat partiyasının server-dəki vəziyyəti.
    FEN (Forsyth-Edwards Notation) lövhənin tam vəziyyətini bir string-də
    saxlayan standartdır — hər gedişdən sonra yenilənir ki, oyunçu
    bağlanıb-geri qoşulsa belə oyun davam etsin."""
    __tablename__ = "chess_games"

    id = Column(Integer, primary_key=True, index=True)
    white_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    black_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    fen = Column(Text, default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    status = Column(Enum(ChessGameStatus), default=ChessGameStatus.waiting)
    winner = Column(String, nullable=True)  # "white" | "black" | "draw" | null
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Quest(Base):
    """
    Sistemdeki mevcut görevlerin (quests) havuzu.
    """
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String, nullable=False) # 'breathe', 'journal', 'mood', vs.
    icon = Column(String, nullable=False)
    label = Column(String, nullable=False)
    reward_xp = Column(Integer, default=10)
    reward_gems = Column(Integer, default=5)
    target = Column(Integer, default=1)
