"""
Authentication decorators - Reference: MandarinTest Guards pattern
Provides @require_auth decorator for protecting routes
"""
from functools import wraps
from flask import request, g
from middleware.auth import verify_token, is_auth_enabled
from utils.response import error_response


def require_auth(f):
    """
    Decorator that requires authentication for a route.
    Reference: MandarinTest/backend/src/common/guards/jwt-auth.guard.ts

    Usage:
        @app.route('/api/protected')
        @require_auth
        def protected_route():
            user = g.current_user  # Access authenticated user
            return {'user_id': user['id']}
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Skip auth check if authentication is not enabled
        if not is_auth_enabled():
            g.current_user = None
            return f(*args, **kwargs)

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response('UNAUTHORIZED', 'Missing authorization header', 401)

        try:
            parts = auth_header.split()
            if len(parts) != 2:
                raise ValueError("Invalid format")
            scheme, token = parts
            if scheme.lower() != 'bearer':
                raise ValueError("Invalid scheme")
        except ValueError:
            return error_response('UNAUTHORIZED', 'Invalid authorization header format. Expected: Bearer <token>', 401)

        user, error = verify_token(token)
        if error:
            return error_response('UNAUTHORIZED', error, 401)

        g.current_user = user
        return f(*args, **kwargs)

    return decorated
