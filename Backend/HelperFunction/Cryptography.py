import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet 

load_dotenv()

def EncryptData(password: str) -> str:
    key = os.getenv('SECURE_KEY')
    if not key:
        raise ValueError("SECURE_KEY not found in environment")
    
    # Ensure the key is in bytes format
    fernet = Fernet(key.encode()) 

    return fernet.encrypt(password.encode()).decode()

def comparePassword(hash_password: str, input_password: str) -> bool:
    key = os.getenv('SECURE_KEY')
    if not key:
        raise ValueError("SECURE_KEY not found in environment")
    
    # 1. Initialize Fernet with the encoded key
    fernet = Fernet(key.strip().encode())
    
    try:
        # 2. Decrypt the STORED hash from the database
        # We encode() the hash_password because Fernet expects bytes
        decrypted_bytes = fernet.decrypt(hash_password.encode())
        decrypted_password = decrypted_bytes.decode()
        
        # 3. Compare decrypted plain text with the user's input
        return decrypted_password == input_password
        
    except Exception as e:
        # If decryption fails (e.g., bad key or corrupted data)
        print(f"Decryption error: {e}")
        return False
    

# result=comparePassword('gAAAAABp1eUCdeyTvpwv6NFvTuqMVHZbAODBRkKzDTh5uqbSwOWFRyuCNsx5PTg8GLQ55UKendcMlGzO4oCOo-AxB4pwzH-JIA==','Hassankhan123@',)
# print(result)