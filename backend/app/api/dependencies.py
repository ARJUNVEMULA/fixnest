from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.all_models import User
from app.schemas.all_schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier: str = str(payload.get("sub"))
        if not identifier:
            raise credentials_exception
        token_data = TokenData(identifier=identifier)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(
        (User.email.ilike(token_data.identifier.strip())) | 
        (User.flat_id == token_data.identifier.strip()) |
        (User.username == token_data.identifier.strip()) |
        (User.mobile_number == token_data.identifier.strip())
    ).first()
    if user is None:
        raise credentials_exception
    return user
