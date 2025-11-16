"""Authentication service for user management and JWT token generation."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from schemas.auth import User as UserSchema, TokenPayload, LoginResponse
from config import settings
from database import get_db, SessionLocal
from database.models import User as UserModel
import uuid


class AuthService:
    """Handles user authentication and JWT token management."""

    def __init__(self):
        """Initialize authentication service."""
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self._initialize_default_users()

    def _initialize_default_users(self):
        """Create default users for development if they don't exist."""
        db = SessionLocal()
        try:
            # Check if users already exist
            if db.query(UserModel).count() == 0:
                # Create default regular user
                user1 = UserModel(
                    user_id=str(uuid.uuid4()),
                    username="user1",
                    password_hash=self.get_password_hash("password123"),
                    is_admin=False
                )
                db.add(user1)

                # Create default admin user
                admin = UserModel(
                    user_id=str(uuid.uuid4()),
                    username="admin",
                    password_hash=self.get_password_hash("admin123"),
                    is_admin=True
                )
                db.add(admin)

                db.commit()
        finally:
            db.close()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Generate password hash."""
        return self.pwd_context.hash(password)

    def authenticate_user(self, username: str, password: str) -> Optional[UserSchema]:
        """Authenticate a user by username and password."""
        db = SessionLocal()
        try:
            user_model = db.query(UserModel).filter(UserModel.username == username).first()
            if not user_model:
                return None
            if not self.verify_password(password, user_model.password_hash):
                return None

            # Convert to schema
            return UserSchema(
                user_id=user_model.user_id,
                username=user_model.username,
                password_hash=user_model.password_hash,
                is_admin=user_model.is_admin
            )
        finally:
            db.close()

    def create_access_token(self, user: UserSchema) -> str:
        """Create JWT access token for authenticated user."""
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = TokenPayload(
            sub=user.user_id,
            username=user.username,
            is_admin=user.is_admin,
            exp=int(expire.timestamp())
        )
        token = jwt.encode(
            payload.model_dump(),
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return token

    def verify_token(self, token: str) -> Optional[TokenPayload]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            token_data = TokenPayload(**payload)
            return token_data
        except JWTError:
            return None

    def login(self, username: str, password: str) -> Optional[LoginResponse]:
        """Process user login and return access token."""
        user = self.authenticate_user(username, password)
        if not user:
            return None

        access_token = self.create_access_token(user)
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.user_id,
            username=user.username,
            is_admin=user.is_admin
        )

    def get_user_by_id(self, user_id: str) -> Optional[UserSchema]:
        """Get user by user_id."""
        db = SessionLocal()
        try:
            user_model = db.query(UserModel).filter(UserModel.user_id == user_id).first()
            if not user_model:
                return None

            # Convert to schema
            return UserSchema(
                user_id=user_model.user_id,
                username=user_model.username,
                password_hash=user_model.password_hash,
                is_admin=user_model.is_admin
            )
        finally:
            db.close()

    def register_user(self, username: str, password: str) -> Optional[LoginResponse]:
        """Register a new user."""
        db = SessionLocal()
        try:
            # Check if username already exists
            existing_user = db.query(UserModel).filter(UserModel.username == username).first()
            if existing_user:
                return None  # Username already taken

            # Create new user
            new_user = UserModel(
                user_id=str(uuid.uuid4()),
                username=username,
                password_hash=self.get_password_hash(password),
                is_admin=False  # New users are not admin by default
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            # Convert to schema
            user_schema = UserSchema(
                user_id=new_user.user_id,
                username=new_user.username,
                password_hash=new_user.password_hash,
                is_admin=new_user.is_admin
            )

            # Auto-login: generate token
            access_token = self.create_access_token(user_schema)
            return LoginResponse(
                access_token=access_token,
                token_type="bearer",
                user_id=user_schema.user_id,
                username=user_schema.username,
                is_admin=user_schema.is_admin
            )
        except Exception as e:
            db.rollback()
            return None
        finally:
            db.close()

    def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Change user password."""
        db = SessionLocal()
        try:
            user_model = db.query(UserModel).filter(UserModel.user_id == user_id).first()
            if not user_model:
                return False

            # Verify old password
            if not self.verify_password(old_password, user_model.password_hash):
                return False

            # Update password
            user_model.password_hash = self.get_password_hash(new_password)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            return False
        finally:
            db.close()
