from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# -------------------------
# USERS TABLE
# -------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)  # hashed password
    role = Column(String, nullable=False, default="user")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    messages = relationship("Message", back_populates="sender")
    chat_memberships = relationship("ChatMember", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


# -------------------------
# CHAT ROOMS TABLE
# -------------------------
class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    messages = relationship("Message", back_populates="room")
    members = relationship("ChatMember", back_populates="room")


# -------------------------
# CHAT MEMBERS (JOIN TABLE)
# -------------------------
class ChatMember(Base):
    __tablename__ = "chat_members"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(Integer, ForeignKey("chat_rooms.id"))
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_memberships")
    room = relationship("ChatRoom", back_populates="members")


# -------------------------
# MESSAGES TABLE
# -------------------------
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(Integer, ForeignKey("chat_rooms.id"))
    content = Column(Text, nullable=False)  # encrypted text
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", back_populates="messages")
    room = relationship("ChatRoom", back_populates="messages")


# -------------------------
# REFRESH TOKENS (JWT)
# -------------------------
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True,autoincrement=True,index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())