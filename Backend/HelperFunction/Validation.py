import re

def isEmail(email : str) -> str:
    """
        Check if the email is a valid format using a common regex pattern.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if re.fullmatch(pattern,email):
        return True
    return False

def isPassword(password : str) -> str:
    """
        Check if the Password is a valid format using a common regex pattern.
    """
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"

    if re.fullmatch(pattern,password):
        return True
    return False

