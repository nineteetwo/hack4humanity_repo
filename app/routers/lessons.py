from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.lesson_data import LESSON_DATA, LESSON_BY_ID
from app import models, schemas

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("", response_model=list[schemas.LessonOut])
def list_lessons():
    """Statik lesson siyahısı — auth tələb olunmur, hər kəs görə bilər."""
    return LESSON_DATA


@router.get("/completed", response_model=list[str])
def my_completed_lessons(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Frontend-dəki LessonTracker.getCompleted()-in server qarşılığı."""
    rows = db.query(models.LessonProgress.lesson_id).filter(
        models.LessonProgress.user_id == current_user.id
    ).all()
    return [r[0] for r in rows]


@router.post("/{lesson_id}/complete", response_model=schemas.LessonCompleteOut)
def complete_lesson(
    lesson_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Frontend-də bu, üç ayrı çağırış idi:
      LessonTracker.markComplete() + StatsPanel.addXP() + StatsPanel.incrementStreak()
    Burda hamısı BİR server sorğusuna və BİR DB tranzaksiyasına yığılıb ki,
    yarımçıq vəziyyət (məs. XP verildi amma "completed" işarələnmədi) yaranmasın.
    """
    lesson = LESSON_BY_ID.get(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Belə lesson yoxdur")

    already = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id,
        models.LessonProgress.lesson_id == lesson_id,
    ).first()

    xp_awarded = 0
    if not already:
        # 1) Completion qeydini yarat
        db.add(models.LessonProgress(user_id=current_user.id, lesson_id=lesson_id))

        # 2) XP + gems ver (client-in göndərdiyi XP-yə YOX, server-dəki
        #    LESSON_DATA-ya güvənirik — bax lesson_data.py-dakı izaha)
        xp_awarded = lesson["xp"]
        current_user.xp += xp_awarded
        current_user.gems += max(1, xp_awarded // 5)

        # 3) Streak-i günə 1 dəfə artır (StatsPanel.incrementStreak() məntiqi)
        today = date.today()
        if current_user.last_streak_date != today:
            current_user.streak += 1
            current_user.last_streak_date = today

        db.commit()
        db.refresh(current_user)

    return schemas.LessonCompleteOut(
        lesson_id=lesson_id,
        xp_awarded=xp_awarded,
        already_completed=already is not None,
        user=current_user,
    )
