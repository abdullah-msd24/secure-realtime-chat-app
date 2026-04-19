from pydantic import BaseModel,EmailStr
from typing import List, Optional

class Register(BaseModel):
    username : str
    email : EmailStr
    password : str
    role : str

class Login(BaseModel):
    email : EmailStr
    password : str
    
class Messages(BaseModel):
    room_id : str
    message : str

class CreateRoomRequest(BaseModel):
    id : str
    name: str
    members : Optional[List[str]] = []