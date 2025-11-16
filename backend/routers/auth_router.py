"""Authentication API router."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Annotated
from schemas.auth import LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest, ChangePasswordResponse, TokenPayload
from utils.dependencies import get_current_user
import utils.dependencies as deps

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    User login endpoint.

    Authenticates user and returns JWT access token.
    """
    deps.monitoring_service.increment_request_count()

    login_response = deps.auth_service.login(request.username, request.password)

    if not login_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return login_response


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest):
    """
    User registration endpoint.

    Creates a new user account and automatically logs them in.
    """
    deps.monitoring_service.increment_request_count()

    # Validate username length
    if len(request.username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long"
        )

    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    register_response = deps.auth_service.register_user(request.username, request.password)

    if not register_response:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    return register_response


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: Annotated[TokenPayload, Depends(get_current_user)]
):
    """
    Change password endpoint (requires authentication).

    Allows authenticated users to change their password.
    """
    deps.monitoring_service.increment_request_count()

    # Validate new password length
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )

    success = deps.auth_service.change_password(
        current_user.sub,
        request.old_password,
        request.new_password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect old password"
        )

    return ChangePasswordResponse(
        success=True,
        message="Password changed successfully"
    )


@router.get("/test")
async def test_auth():
    """Test endpoint to verify auth service is working."""
    return {"message": "Auth service is running", "default_users": ["user1", "admin"]}
