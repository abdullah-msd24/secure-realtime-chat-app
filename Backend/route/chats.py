# for personal things i do like if the message contains @Name then perosnal to this user
import os
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

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



@router.post("/api/chats/rooms")
def create_room(
    payload: schemas.CreateRoomRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_id = JasonWebToken.verifyAccessToken(token)["data"]["id"]

    payload.id = str(payload.id)


    # 1. Create room
    room = models.ChatRoom(
        id= payload.id,
        name=payload.name,
        created_by=user_id
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    # 2. Add creator as member
    db.add(models.ChatMember(
        user_id=user_id,
        room_id=room.id
    ))

    # 3. Add other members (IMPORTANT PART)
    for email in payload.members:

        user = db.query(models.User).filter(
            models.User.email == email
        ).first()

        if user:
            db.add(models.ChatMember(
                user_id=user.id,
                room_id=room.id
            ))

    db.commit()

    return {
        "room_id": room.id,
        "name": room.name
    }

@router.post("/api/chats/messages")
def send_message(
    req: schemas.Messages,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        # -------------------------
        # 1. TOKEN VALIDATION
        # -------------------------
        token = credentials.credentials

        payload = JasonWebToken.verifyAccessToken(token)

        if not payload or "data" not in payload:
            logger.warning("Invalid token used for message send")
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload["data"].get("id")

        if not user_id:
            logger.warning("Token missing user id")
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # -------------------------
        # 2. FETCH ROOM
        # -------------------------
        room = db.query(models.ChatRoom).filter_by(name=req.name).first()

        if not room:
            logger.warning(f"Chat room not found: {req.name}")
            raise HTTPException(status_code=404, detail="Chat room not found")

        # -------------------------
        # 3. CHECK MEMBERSHIP
        # -------------------------
        member = db.query(models.ChatMember).filter_by(
            user_id=user_id,
            room_id=room.id
        ).first()

        if not member:
            logger.warning(
                f"Unauthorized message attempt by user={user_id} in room={room.id}"
            )
            raise HTTPException(status_code=403, detail="Not a member of this room")

        # -------------------------
        # 4. CREATE MESSAGE
        # -------------------------
        message = models.Message(
            sender_id=user_id,
            room_id=room.id,
            content=req.message
        )

        db.add(message)
        db.commit()
        db.refresh(message)

        logger.info(
            f"Message sent | user={user_id} room={room.id} message_id={message.id}"
        )

        return {
            "message_id": message.id,
            "content": message.content,
            "status": 200
        }

    except HTTPException as http_exc:
        # re-raise known errors
        raise http_exc

    except Exception as e:
        # unexpected system error
        db.rollback()

        logger.error(
            f"Unexpected error in send_message | user={user_id if 'user_id' in locals() else None} | error={str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.get("/api/chats/messages/{room_name}")
def get_messages(
    room_name: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # -------------------------
    # 1. JWT Verification
    # -------------------------
    try:
        payload = JasonWebToken.verifyAccessToken(credentials.credentials)
        user_id = payload["data"]["id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # -------------------------
    # 2. Get room safely
    # -------------------------
    room = db.execute(
        text("SELECT id FROM chat_rooms WHERE name = :name"),
        {"name": room_name}
    ).fetchone()

    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")

    room_id = room._mapping["id"]   # ✅ FIX

    # -------------------------
    # 3. Membership check
    # -------------------------
    member = db.execute(
        text("""
            SELECT 1 FROM chat_members
            WHERE user_id = :user_id AND room_id = :room_id
        """),
        {"user_id": user_id, "room_id": room_id}
    ).fetchone()

    if not member:
        raise HTTPException(status_code=403, detail="Access denied")

    # -------------------------
    # 4. Fetch messages
    # -------------------------
    messages = db.execute(
        text("""
            SELECT id, sender_id, content, created_at
            FROM messages
            WHERE room_id = :room_id
            ORDER BY created_at ASC
        """),
        {"room_id": room_id}
    ).fetchall()

    # -------------------------
    # 5. Safe JSON response
    # -------------------------
    return [dict(row._mapping) for row in messages]

@router.get("/api/chats/rooms/{room_name}")
def get_room(
    room_name: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # Verify user belongs to room
    query = text("""
        SELECT * FROM chat_rooms 
        WHERE created_by = :user_id AND name = :room_name
    """)
    
    res_room = db.execute(query, {
        'user_id': user_id,
        'room_name': room_name
    }).fetchone()

    if not res_room:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get members of the room
    members_query = text("""
        SELECT user_id FROM chat_members 
        WHERE room_id = :room_id
    """)
    
    members = db.execute(members_query, {
        'room_id': res_room.id
    }).fetchall()

    

    return {
        "room_id": res_room.id,
        "name": res_room.name,
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



@router.get('/api/v1/getRooms')
def get_rooms(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # 🔐 Verify token properly
    token = credentials.credentials
    payload = JasonWebToken.verifyAccessToken(token)

    if not payload["status"]:
        raise HTTPException(status_code=401, detail=payload["message"])

    user_id = payload["data"]["id"]

    # 📦 Query
    query = text("""
        SELECT id,name
        FROM chat_rooms 
        WHERE created_by = :user_id
    """)

    result = db.execute(query, {"user_id": user_id}).mappings().all()

    # 🧼 Clean response (optional but better)
    return {
        "rooms": result
        
    }


@router.delete("/api/chats/rooms/{room_id}")
def remove_room(
    room_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    payload = JasonWebToken.verifyAccessToken(credentials.credentials)
    if not payload or "data" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload["data"]["id"]

    # 1. Check existence and ownership
    query = text("SELECT created_by FROM chat_rooms WHERE id = :id")
    room = db.execute(query, {"id": room_id}).mappings().fetchone()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room["created_by"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        # 2. DELETE MESSAGES FIRST (The Constraint)
        db.execute(text("DELETE FROM messages WHERE room_id = :id"), {"id": room_id})

        # 3. DELETE MEMBERS SECOND
        db.execute(text("DELETE FROM chat_members WHERE room_id = :id"), {"id": room_id})

        # 4. DELETE THE ROOM LAST
        db.execute(text("DELETE FROM chat_rooms WHERE id = :id"), {"id": room_id})
        
        db.commit()
        return {"message": "Room and all associated history deleted"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
@router.delete("/api/chats/rooms/{room_name}/members/{target_username}")
def remove_member(
    room_name: str,
    target_username: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # 1. Get Current User (The one performing the action)
    current_user_id = JasonWebToken.verifyAccessToken(credentials.credentials)['data']['id']

    # 2. Find Room ID and Target User ID using Plain SQL
    # We need the UUID of the room and the ID of the user we want to kick
    sql_find_info = text("""
        SELECT cr.id as room_id, u.id as target_uid 
        FROM chat_rooms cr, users u 
        WHERE cr.name = :r_name AND u.username = :u_name
    """)
    
    info = db.execute(sql_find_info, {"r_name": room_name, "u_name": target_username}).fetchone()
    
    if not info:
        raise HTTPException(status_code=404, detail="Room or User not found")
    
    room_uuid = info.room_id
    target_user_id = info.target_uid

    # 3. Security Check: Is the current user a member of this room?
    # (Optional: You could also check if current_user_id is the room 'created_by')
    check_membership = text("""
        SELECT 1 FROM chat_members 
        WHERE user_id = :uid AND room_id = :rid
    """)
    if not db.execute(check_membership, {"uid": current_user_id, "rid": room_uuid}).fetchone():
        raise HTTPException(status_code=403, detail="You are not a member of this room")

    # 4. PERFORM DELETE (Plain SQL)
    sql_delete = text("""
        DELETE FROM chat_members 
        WHERE user_id = :t_uid AND room_id = :rid
    """)
    
    db.execute(sql_delete, {"t_uid": target_user_id, "rid": room_uuid})
    db.commit() # Don't forget to commit when using plain SQL!

    return {"message": f"User {target_username} removed from {room_name}"}