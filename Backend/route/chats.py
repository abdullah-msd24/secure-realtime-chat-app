import os
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Import your helpers and models
from PostgresSql.database import get_db, Base, engine
from PostgresSql import models
from PostgresSql.models import User,ChatRoom,ChatMember,Message,RefreshToken
from HelperFunction import JasonWebToken
from HelperFunction.Cryptography import EncryptData, comparePassword
from HelperFunction.Validation import isEmail, isPassword
from schemas import Register, Login
import schemas
# Load environment variables
load_dotenv()

# JWT / security setup
security = HTTPBearer()
TOKEN_EXPIRY_TIME_MINUTES = int(os.getenv("TOKEN_EXPIRY_TIME_MINUTES", 60))

# Initialize database tables if not exists
models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    filename=r'E:\Class Book\Secure-Software-Design-And-Engineering\Project\Backend\logs.log',
    filemode='a',
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# SlowAPI limiter
limiter = Limiter(key_func=get_remote_address)
router.state.limiter = limiter
router.add_middleware(SlowAPIMiddleware)

# Rate limit exception handler
def _rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."}
    )

router.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# ******************* EndPoints  ********************************************************


@router.post("/api/chats/rooms")
@limiter.limit("5/minute")
def create_room(
    payload: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_id = JasonWebToken.verifyAccessToken(token)['data']['id']

    # 1. Create room
    room = models.ChatRoom(
        name=payload.name,
        created_by=user_id
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    # 2. Add creator as member
    db.add(models.ChatMember(user_id=user_id, room_id=room.id))
    db.commit()

    return {
        "room_id": room.id,
        "name": room.name
    }
    
@router.post("/api/chats/messages")
@limiter.limit("10/minute")
def send_message(
    req: schemas.Messages,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_id = JasonWebToken.verifyAccessToken(token)['data']['id']

    # ✅ Check membership (IMPORTANT)
    member = db.query(models.ChatMember).filter_by(
        user_id=user_id,
        room_id=req.room_id
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this room")

    # ✅ Create message
    message = models.Message(
        sender_id=user_id,
        room_id=req.room_id,
        content=req.content
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "message_id": message.id,
        "content": message.content
    }

@router.get("/api/chats/messages/{room_id}")
@limiter.limit("15/minute")
def get_messages(
    room_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # ✅ Check membership
    member = db.query(models.ChatMember).filter_by(
        user_id=user_id,
        room_id=room_id
    ).first()

    if not member:
        raise HTTPException(403, "Access denied")

    messages = (
        db.query(models.Message)
        .filter(models.Message.room_id == room_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return messages

@router.get("/api/chats/rooms/{room_id}")
def get_room(
    room_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # ✅ Check membership
    member = db.query(ChatMember).filter_by(
        user_id=user_id,
        room_id=room_id
    ).first()

    if not member:
        raise HTTPException(403, "Access denied")

    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()

    members = db.query(ChatMember).filter_by(room_id=room_id).all()

    return {
        "room_id": room.id,
        "name": room.name,
        "members": [m.user_id for m in members]
    }

@router.post("/api/chats/rooms/{room_id}/members")
def add_member(
    room_id: int,
    new_user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # ✅ Only member can add (you can later restrict to admin)
    member = db.query(ChatMember).filter_by(
        user_id=user_id,
        room_id=room_id
    ).first()

    if not member:
        raise HTTPException(403, "Not allowed")

    # ✅ Prevent duplicate
    existing = db.query(ChatMember).filter_by(
        user_id=new_user_id,
        room_id=room_id
    ).first()

    if existing:
        raise HTTPException(400, "User already in room")

    db.add(ChatMember(user_id=new_user_id, room_id=room_id))
    db.commit()

    return {"message": "User added"}

@router.delete("/api/chats/rooms/{room_id}/members/{user_id}")
def remove_member(
    room_id: int,
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    current_user = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # ✅ Only room creator can remove
    room = db.query(ChatRoom).filter_by(id=room_id).first()

    if room.created_by != current_user:
        raise HTTPException(403, "Only creator can remove users")

    member = db.query(ChatMember).filter_by(
        user_id=user_id,
        room_id=room_id
    ).first()

    if not member:
        raise HTTPException(404, "User not in room")

    db.delete(member)
    db.commit()

    return {"message": "User removed"}

@router.get("/api/chats/rooms/{room_id}/members")
def get_members(
    room_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # ✅ Check membership
    member = db.query(ChatMember).filter_by(
        user_id=user_id,
        room_id=room_id
    ).first()

    if not member:
        raise HTTPException(403, "Access denied")

    members = db.query(ChatMember).filter_by(room_id=room_id).all()

    return [m.user_id for m in members]

@router.delete("/api/v1/rooms/{room_id}")
def delete_room(
    room_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    room = db.query(ChatRoom).filter_by(id=room_id).first()

    if not room:
        raise HTTPException(404, "Room not found")

    if room.created_by != user_id:
        raise HTTPException(403, "Only creator can delete")

    db.delete(room)
    db.commit()

    return {"message": "Room deleted"}