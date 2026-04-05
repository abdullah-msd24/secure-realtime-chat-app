from pydantic import BaseModel,EmailStr

class Register(BaseModel):
    username : str
    email : str
    password_hash : str
    role : str

class Login(BaseModel):
    email : str
    password : str
    
class Messages(BaseModel):
    room_id : str
    message : str