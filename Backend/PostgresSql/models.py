from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Text, event
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from PostgresSql.database import Base
import bcrypt
import uuid

# -------------------------
# PASSWORD HASHING
# -------------------------
def default_admin_password() -> str:
    password = "StrongAdminPassword123!".encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode("utf-8")


# -------------------------
# USERS TABLE
# -------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    messages = relationship("Message", back_populates="sender")
    chat_memberships = relationship("ChatMember", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


# -------------------------
# AUDIT LOGS
# -------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    details = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")


# -------------------------
# CHAT ROOMS
# -------------------------
class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(String, primary_key=True, index=True)  # UUID string
    name = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    messages = relationship("Message", back_populates="room")
    members = relationship("ChatMember", back_populates="room")


# -------------------------
# CHAT MEMBERS
# -------------------------
class ChatMember(Base):
    __tablename__ = "chat_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(String, ForeignKey("chat_rooms.id"))  # ✅ FIXED
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_memberships")
    room = relationship("ChatRoom", back_populates="members")


# -------------------------
# MESSAGES
# -------------------------
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(String, ForeignKey("chat_rooms.id"))  # ✅ FIXED
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    sender = relationship("User", back_populates="messages")
    room = relationship("ChatRoom", back_populates="messages")


# -------------------------
# REFRESH TOKENS
# -------------------------
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


# -------------------------
# ADMIN TABLE
# -------------------------
class AdminCredentials(Base):
    __tablename__ = "admin_table"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


# -------------------------
# AUTO ADMIN SEED
# -------------------------
@event.listens_for(AdminCredentials.__table__, "after_create")
def insert_initial_admin(target, connection, **kw):
    connection.execute(
        target.insert().values(
            email="secure12311admin@example.com",
            password_hash=default_admin_password(),
        )
    )