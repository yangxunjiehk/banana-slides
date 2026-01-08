"""
Multi-tenant isolation helper functions
Reference: MandarinTest/backend/src/common/guards/tenant.guard.ts

Provides utilities for user-scoped data access in a multi-tenant system.
"""
from flask import g
from utils.response import not_found


def get_current_user():
    """Get current authenticated user from Flask g object"""
    return getattr(g, 'current_user', None)


def get_current_user_id():
    """
    Get current user ID.
    Returns None if user is not authenticated or auth is disabled.
    """
    user = get_current_user()
    return user['id'] if user else None


def get_user_project(project_id):
    """
    Get a project that belongs to the current user.
    Reference: MandarinTest's TenantGuard logic

    Args:
        project_id: The project ID to look up

    Returns:
        Project instance if found and belongs to current user, None otherwise
    """
    from models import Project
    from middleware.auth import is_auth_enabled

    # If auth is disabled, return project without user check
    if not is_auth_enabled():
        return Project.query.get(project_id)

    user_id = get_current_user_id()
    if not user_id:
        return None

    return Project.query.filter_by(
        id=project_id,
        user_id=user_id
    ).first()


def require_project_ownership(project_id):
    """
    Verify project ownership for the current user.

    Args:
        project_id: The project ID to verify

    Returns:
        tuple: (project, error_response)
        - On success: (project_instance, None)
        - On failure: (None, flask_error_response)
    """
    project = get_user_project(project_id)
    if not project:
        return None, not_found('Project')
    return project, None


def user_filtered_query(model):
    """
    Return a query filtered by current user's ID.
    Reference: MandarinTest/backend/src/common/extensions/prisma-tenant.extension.ts

    This is the SQLAlchemy equivalent of Prisma's tenant extension.

    Args:
        model: SQLAlchemy model class with user_id column

    Returns:
        SQLAlchemy query filtered by user_id, or unfiltered if auth disabled
    """
    from middleware.auth import is_auth_enabled

    # If auth is disabled, return unfiltered query
    if not is_auth_enabled():
        return model.query

    user_id = get_current_user_id()
    if user_id:
        return model.query.filter_by(user_id=user_id)

    # Return empty query if no user (should not happen with proper auth)
    return model.query.filter(False)


def set_user_id_on_create(model_instance):
    """
    Set user_id on a new model instance before saving.

    Args:
        model_instance: SQLAlchemy model instance with user_id attribute

    Returns:
        The model instance with user_id set
    """
    from middleware.auth import is_auth_enabled

    if is_auth_enabled():
        user_id = get_current_user_id()
        if user_id and hasattr(model_instance, 'user_id'):
            model_instance.user_id = user_id

    return model_instance
