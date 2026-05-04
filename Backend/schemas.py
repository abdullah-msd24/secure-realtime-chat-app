from pydantic import BaseModel,EmailStr,StringConstraints
from typing import List, Optional
from typing import Annotated

class Register(BaseModel):
    username : str
    email : EmailStr
    password : str
    role : str

class Login(BaseModel):
    email : EmailStr
    password : Annotated[str,StringConstraints(min_length=8,max_length=32)]
    
class Messages(BaseModel):
    name : str
    message : Annotated[str,StringConstraints(min_length=3,max_length=1000)]

class CreateRoomRequest(BaseModel):
    id : int
    name: str
    members : Optional[List[str]] = []