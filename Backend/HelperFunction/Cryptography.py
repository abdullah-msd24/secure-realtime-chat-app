import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet 

load_dotenv()

def EncryptData(password : str) -> str:
    fernet = Fernet(os.getenv('SECURE_KEY')) 

    return fernet.encrypt(password.encode()).decode()


def comparePassword(hash_password : str,input_password : str) -> bool:
    fernet = Fernet(os.getenv('SECURE_KEY'))
    decrypt_password = fernet.decrypt(input_password.encode()).decode()
    return decrypt_password == input_password