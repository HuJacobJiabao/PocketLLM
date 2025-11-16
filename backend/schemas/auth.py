"""Authentication schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Request schema for user login."""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Response schema for successful login."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    is_admin: bool


class TokenPayload(BaseModel):
    """JWT token payload schema."""
    sub: str  # user_id
    username: str
    is_admin: bool
    exp: int  # expiration timestamp


class User(BaseModel):
    """User model."""
    user_id: str
    username: str
    password_hash: str
    is_admin: bool = False


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password."""
    old_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    """Response schema for password change."""
    success: bool
    message: str
