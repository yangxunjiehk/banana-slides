"""Whitelist Controller - Admin-only API for managing email whitelist"""

import logging
from flask import Blueprint, request, g
from models import AllowedEmail
from utils import success_response, error_response, bad_request
from config import Config
from middleware.auth import get_current_user, is_auth_enabled

logger = logging.getLogger(__name__)

whitelist_bp = Blueprint(
    "whitelist", __name__, url_prefix="/api/whitelist"
)


def is_admin():
    """
    Check if current user is an admin.
    Admin emails are configured via ADMIN_EMAILS environment variable.
    """
    user = get_current_user()
    if not user:
        return False

    user_email = (user.get('email') or '').lower()
    return user_email in Config.ADMIN_EMAILS


def require_admin(f):
    """Decorator to require admin access for an endpoint"""
    from functools import wraps

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_auth_enabled():
            # If auth is disabled, allow all access
            return f(*args, **kwargs)

        if not is_admin():
            return error_response(
                "FORBIDDEN",
                "Admin access required",
                403
            )
        return f(*args, **kwargs)

    return decorated_function


@whitelist_bp.route("/", methods=["GET"], strict_slashes=False)
@require_admin
def get_whitelist():
    """
    GET /api/whitelist - Get all whitelisted emails (admin only)

    Returns:
        {
            "success": true,
            "data": {
                "emails": [
                    {"id": 1, "email": "user@example.com", "added_by": "admin@example.com", "created_at": "..."},
                    ...
                ],
                "is_admin": true
            }
        }
    """
    try:
        emails = AllowedEmail.query.order_by(AllowedEmail.created_at.desc()).all()
        return success_response({
            "emails": [e.to_dict() for e in emails],
            "is_admin": True
        })
    except Exception as e:
        logger.error(f"Error getting whitelist: {str(e)}")
        return error_response(
            "GET_WHITELIST_ERROR",
            f"Failed to get whitelist: {str(e)}",
            500
        )


@whitelist_bp.route("/", methods=["POST"], strict_slashes=False)
@require_admin
def add_email():
    """
    POST /api/whitelist - Add an email to whitelist (admin only)

    Request Body:
        {
            "email": "newuser@example.com"
        }

    Returns:
        {
            "success": true,
            "data": {"id": 1, "email": "newuser@example.com", ...},
            "message": "Email added to whitelist"
        }
    """
    try:
        data = request.get_json()
        if not data or not data.get('email'):
            return bad_request("Email is required")

        email = data['email'].strip().lower()

        # Validate email format (basic check)
        if '@' not in email or '.' not in email:
            return bad_request("Invalid email format")

        # Get current admin's email
        user = get_current_user()
        added_by = user.get('email') if user else 'system'

        # Add to whitelist
        allowed_email = AllowedEmail.add_email(email, added_by=added_by)

        logger.info(f"Email {email} added to whitelist by {added_by}")
        return success_response(
            allowed_email.to_dict(),
            "Email added to whitelist"
        )

    except Exception as e:
        logger.error(f"Error adding email to whitelist: {str(e)}")
        return error_response(
            "ADD_EMAIL_ERROR",
            f"Failed to add email: {str(e)}",
            500
        )


@whitelist_bp.route("/<email>", methods=["DELETE"], strict_slashes=False)
@require_admin
def remove_email(email):
    """
    DELETE /api/whitelist/<email> - Remove an email from whitelist (admin only)

    Returns:
        {
            "success": true,
            "message": "Email removed from whitelist"
        }
    """
    try:
        email = email.strip().lower()

        # Prevent removing admin emails (safety check)
        if email in Config.ADMIN_EMAILS:
            return error_response(
                "CANNOT_REMOVE_ADMIN",
                "Cannot remove admin email from whitelist",
                400
            )

        removed = AllowedEmail.remove_email(email)

        if removed:
            user = get_current_user()
            removed_by = user.get('email') if user else 'system'
            logger.info(f"Email {email} removed from whitelist by {removed_by}")
            return success_response(None, "Email removed from whitelist")
        else:
            return error_response(
                "EMAIL_NOT_FOUND",
                "Email not found in whitelist",
                404
            )

    except Exception as e:
        logger.error(f"Error removing email from whitelist: {str(e)}")
        return error_response(
            "REMOVE_EMAIL_ERROR",
            f"Failed to remove email: {str(e)}",
            500
        )


@whitelist_bp.route("/check-admin", methods=["GET"], strict_slashes=False)
def check_admin_status():
    """
    GET /api/whitelist/check-admin - Check if current user is admin

    This endpoint can be called by any authenticated user to check their admin status.
    Used by frontend to determine whether to show admin UI.

    Returns:
        {
            "success": true,
            "data": {
                "is_admin": true/false
            }
        }
    """
    try:
        return success_response({
            "is_admin": is_admin()
        })
    except Exception as e:
        logger.error(f"Error checking admin status: {str(e)}")
        return error_response(
            "CHECK_ADMIN_ERROR",
            f"Failed to check admin status: {str(e)}",
            500
        )
