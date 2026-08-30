"""
Anket/quest submission endpoint-ləri.

POST /quests/{lesson_id}/submit
  - İstifadəçinin quest tamamlama seçimini (mood, journal, vs.) qəbul edir
  - quest_submissions cədvəlinə yazır
  - Eyni zamanda lesson_progress + XP/streak güncəlləməsini tetikler

GET /quests/my-submissions
  - Cari istifadəçinin bütün submission tarixçəsini qaytarır
  - Mood tarixçəsi, journal girişləri kimi analitika üçün istifadə edilə bilər
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.lesson_data import LESSON_BY_ID
from app import models, schemas

router = APIRouter(prefix="/quests", tags=["quests"])


@router.post("/{lesson_id}/submit", response_model=schemas.QuestSubmitOut)
def submit_quest(
    lesson_id: str,
    payload: schemas.QuestSubmitIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    İstifadəçinin quest/anket seçimini qeyd et və lessonı tamamla.

    - mood taskType üçün mood_value (1-5) və isteğe bağlı text_content (not) göndərilir
    - journal taskType üçün text_content göndərilir
    - breathe/timer/confirm/celebrate üçün payload boş da ola bilər

    Eyni lessonun submission-u təkrarlanır (tarixçə tutulur),
    amma XP yalnız birinci tamamlamada verilir (idempotent).
    """
    lesson = LESSON_BY_ID.get(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Belə lesson yoxdur")

    # Mood validation
    if payload.task_type == "mood" and payload.mood_value is not None:
        if not (1 <= payload.mood_value <= 5):
            raise HTTPException(status_code=422, detail="mood_value 1 ilə 5 arasında olmalıdır")

    # 1) Quest submission-u qeyd et (hər seferinde yeni sətir — geçmiş tutulur)
    submission = models.QuestSubmission(
        user_id=current_user.id,
        lesson_id=lesson_id,
        task_type=payload.task_type,
        mood_value=payload.mood_value,
        text_content=payload.text_content,
    )
    db.add(submission)

    # 2) Lesson tamamlanmasını kontrol et (XP idempotent)
    already = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id,
        models.LessonProgress.lesson_id == lesson_id,
    ).first()

    xp_awarded = 0
    if not already:
        # İlk tamamlama: progress + XP + streak
        db.add(models.LessonProgress(user_id=current_user.id, lesson_id=lesson_id))

        xp_awarded = lesson["xp"]
        current_user.xp += xp_awarded
        current_user.gems += max(1, xp_awarded // 5)

        today = date.today()
        if current_user.last_streak_date != today:
            current_user.streak += 1
            current_user.last_streak_date = today

    db.commit()
    db.refresh(submission)
    db.refresh(current_user)

    return schemas.QuestSubmitOut(
        id=submission.id,
        lesson_id=lesson_id,
        task_type=submission.task_type,
        mood_value=submission.mood_value,
        text_content=submission.text_content,
        submitted_at=submission.submitted_at,
        xp_awarded=xp_awarded,
        already_completed=already is not None,
        user=current_user,
    )


@router.get("/my-submissions", response_model=list[schemas.QuestSubmissionHistoryItem])
def my_submissions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cari istifadəçinin bütün quest submission tarixçəsi.
    Mood analitikası, journal tarixçəsi kimi məqsədlər üçün istifadə edilə bilər.
    """
    rows = (
        db.query(models.QuestSubmission)
        .filter(models.QuestSubmission.user_id == current_user.id)
        .order_by(models.QuestSubmission.submitted_at.desc())
        .all()
    )
    return rows

import random

@router.get("/daily")
def get_daily_quests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns 3 random quests for the current day for the current user.
    """
    all_quests = db.query(models.Quest).all()
    if not all_quests:
        return []
        
    # Seed based on user_id and current date so it stays same all day
    today = date.today().toordinal()
    seed = today + current_user.id
    
    rng = random.Random(seed)
    num_to_pick = min(3, len(all_quests))
    selected = rng.sample(all_quests, num_to_pick)
    
    # Randomize XP between 10 and 60
    # To not modify the actual db model, we create dicts
    result = []
    for q in selected:
        q_dict = {
            "id": q.id,
            "task_type": q.task_type,
            "icon": q.icon,
            "label": q.label,
            "reward_xp": rng.randint(10, 60),
            "reward_gems": q.reward_gems,
            "target": q.target
        }
        result.append(q_dict)
    
    return result

@router.post("/daily/{quest_id}/submit")
def submit_daily_quest(
    quest_id: int,
    payload: schemas.QuestSubmitIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a daily quest.
    """
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Mood validation
    if payload.task_type == "mood" and payload.mood_value is not None:
        if not (1 <= payload.mood_value <= 5):
            raise HTTPException(status_code=422, detail="mood_value must be between 1 and 5")

    # Reconstruct the random XP for this quest
    all_quests = db.query(models.Quest).all()
    today = date.today().toordinal()
    seed = today + current_user.id
    rng = random.Random(seed)
    num_to_pick = min(3, len(all_quests))
    selected = rng.sample(all_quests, num_to_pick)
    
    xp_to_award = quest.reward_xp
    for q in selected:
        random_xp = rng.randint(10, 60)
        if q.id == quest_id:
            xp_to_award = random_xp

    # 1) Quest submission-u qeyd et
    submission = models.QuestSubmission(
        user_id=current_user.id,
        lesson_id=f"daily_{quest_id}", # Hack to reuse QuestSubmission
        task_type=payload.task_type,
        mood_value=payload.mood_value,
        text_content=payload.text_content,
    )
    db.add(submission)

    # 2) Give rewards
    current_user.xp += xp_to_award
    current_user.gems += quest.reward_gems

    db.commit()
    db.refresh(submission)
    db.refresh(current_user)

    return {
        "status": "success",
        "xp_awarded": xp_to_award,
        "gems_awarded": quest.reward_gems,
        "user_xp": current_user.xp,
        "user_gems": current_user.gems
    }
