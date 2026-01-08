"""
User model - stores user information synced from Supabase
"""
import uuid
from datetime import datetime
from . import db


class User(db.Model):
    """
    User model - represents a user synced from Supabase Auth

    The id field stores the Supabase user ID (UUID format).
    User information is synced on first login and updated on subsequent logins.
    """
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True)  # Supabase user ID
    email = db.Column(db.String(200), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    projects = db.relationship('Project', back_populates='user',
                               cascade='all, delete-orphan', lazy='select')
    templates = db.relationship('UserTemplate', back_populates='user',
                                cascade='all, delete-orphan', lazy='select')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() + 'Z' if self.last_login_at else None,
        }

    @classmethod
    def get_or_create(cls, user_id, email, display_name=None, avatar_url=None):
        """
        Get existing user or create new one.

        Args:
            user_id: Supabase user ID
            email: User's email
            display_name: Optional display name
            avatar_url: Optional avatar URL

        Returns:
            User instance
        """
        user = cls.query.get(user_id)
        if user:
            # Update last login and any changed info
            user.last_login_at = datetime.utcnow()
            if display_name:
                user.display_name = display_name
            if avatar_url:
                user.avatar_url = avatar_url
            db.session.commit()
        else:
            # Create new user
            user = cls(
                id=user_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url,
                last_login_at=datetime.utcnow()
            )
            db.session.add(user)
            db.session.commit()
        return user

    def __repr__(self):
        return f'<User {self.id}: {self.email}>'
