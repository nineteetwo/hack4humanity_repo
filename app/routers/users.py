from fastapi import APIRouter, Depends

from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    """Frontend-dəki StatsPanel.state-in server versiyası: streak/hp/xp/gems
    burdan gəlir, artıq localStorage-dan deyil."""
    return current_user


from sqlalchemy.orm import Session
from app.database import get_db
from fastapi import HTTPException, status
from sqlalchemy import or_

@router.get("/search")
def search_users(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Search users by name or email"""
    if not q or len(q) < 2:
        return []
    search = f"%{q}%"
    users = db.query(models.User).filter(
        models.User.id != current_user.id,
        or_(models.User.name.ilike(search), models.User.email.ilike(search))
    ).limit(10).all()
    
    # Also check if already following
    following_ids = [f.friend_id for f in current_user.following]
    
    return [
        {
            "id": u.id,
            "name": u.name,
            "xp": u.xp,
            "streak": u.streak,
            "is_friend": u.id in following_ids
        } for u in users
    ]

@router.post("/friends/{friend_id}")
def add_friend(friend_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Add a user as a friend (follow)"""
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="Özünü əlavə edə bilməzsən.")
    
    friend_user = db.query(models.User).filter(models.User.id == friend_id).first()
    if not friend_user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı.")
        
    existing = db.query(models.Friend).filter(
        models.Friend.user_id == current_user.id,
        models.Friend.friend_id == friend_id
    ).first()
    
    if existing:
        return {"detail": "Artıq dostunuzdur."}
        
    new_friend = models.Friend(user_id=current_user.id, friend_id=friend_id)
    db.add(new_friend)
    db.commit()
    return {"detail": "Dost əlavə edildi."}

@router.delete("/friends/{friend_id}")
def remove_friend(friend_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Remove a user from friends (unfollow)"""
    existing = db.query(models.Friend).filter(
        models.Friend.user_id == current_user.id,
        models.Friend.friend_id == friend_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
    return {"detail": "Dost silindi."}

@router.get("/friends")
def get_friends(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get list of friends ranked by XP"""
    friends = db.query(models.Friend).filter(models.Friend.user_id == current_user.id).all()
    friend_ids = [f.friend_id for f in friends]
    
    users = db.query(models.User).filter(models.User.id.in_(friend_ids)).order_by(models.User.xp.desc()).all()
    
    return [
        {
            "id": u.id,
            "name": u.name,
            "xp": u.xp,
            "streak": u.streak
        } for u in users
    ]
