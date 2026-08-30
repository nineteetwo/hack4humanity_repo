from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.TokenOut, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.SignupIn, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        # Diqqət: "email already exists" YOX, ümumi mesaj vermək daha
        # təhlükəsizdir — əks halda hücumçu bu endpoint-i istifadə edib
        # hansı email-lərin sistemdə qeydiyyatdan keçdiyini yoxlaya bilər
        # (user enumeration hücumu). Amma UX üçün signup formunda dəqiq
        # mesaj adətən qəbul edilə bilir — sizin scope-unuza görə seçin.
        raise HTTPException(status_code=400, detail="Bu email artıq qeydiyyatdan keçib")

    user = models.User(
        email=payload.email,
        name=payload.name,
        password_hash=auth.hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(user.id)
    return schemas.TokenOut(access_token=token)


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    # Qəsdən "email tapılmadı" / "parol yanlışdır" ayırmırıq — hər ikisinə
    # eyni mesajı veririk. Fərqli mesajlar hücumçuya hansı email-in
    # mövcud olduğunu bildirər (user enumeration).
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email və ya parol yanlışdır")

    token = auth.create_access_token(user.id)
    return schemas.TokenOut(access_token=token)
