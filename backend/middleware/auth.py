"""
Authentication middleware - Reference: MandarinTest jwt.strategy.ts
Handles Supabase JWT token verification
"""
import logging
import jwt
from flask import current_app, g

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase_client():
    """Get Supabase client singleton (lazy initialization)"""
    global _supabase_client
    if _supabase_client:
        return _supabase_client

    url = current_app.config.get('SUPABASE_URL')
    key = current_app.config.get('SUPABASE_SERVICE_KEY')
    if url and key:
        try:
            from supabase import create_client
            _supabase_client = create_client(url, key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return _supabase_client


def is_auth_enabled():
    """
    Check if authentication is enabled.
    Auth is enabled only when SUPABASE_URL and SUPABASE_JWT_SECRET are configured.
    """
    url = current_app.config.get('SUPABASE_URL')
    jwt_secret = current_app.config.get('SUPABASE_JWT_SECRET')
    return bool(url and jwt_secret)


def get_current_user():
    """
    Get current user from Flask g object.
    Similar to MandarinTest's @CurrentUser() decorator.
    """
    return getattr(g, 'current_user', None)


def verify_token(token):
    """
    Verify Supabase JWT token using Supabase SDK.

    Args:
        token: JWT access token from Authorization header

    Returns:
        tuple: (user_dict, error_message)
        - On success: (user_dict, None)
        - On failure: (None, error_message)
    """
    # Use Supabase SDK to verify token (handles ES256/RS256/HS256 automatically)
    supabase = get_supabase_client()
    if not supabase:
        return None, "Supabase client not configured"

    try:
        # Use Supabase's get_user() to verify the token
        # This method validates the JWT using Supabase's internal verification
        response = supabase.auth.get_user(token)

        if response and response.user:
            user = {
                'id': response.user.id,
                'email': response.user.email,
                'role': response.user.role or 'authenticated',
                'app_metadata': response.user.app_metadata or {},
                'user_metadata': response.user.user_metadata or {},
            }
            logger.debug(f"Token verified for user: {user['email']}")
            return user, None
        else:
            return None, "Invalid token: no user found"

    except Exception as e:
        error_msg = str(e)
        # Check for common error patterns
        if 'expired' in error_msg.lower():
            return None, "Token has expired"
        elif 'invalid' in error_msg.lower():
            return None, f"Invalid token: {error_msg}"
        else:
            logger.error(f"Token verification error: {e}")
            return None, f"Token verification failed: {error_msg}"
