"""AllowedEmail model - stores whitelist emails"""
from datetime import datetime, timezone
from . import db


class AllowedEmail(db.Model):
    """
    AllowedEmail model - stores emails allowed to access the system
    """
    __tablename__ = 'allowed_emails'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    added_by = db.Column(db.String(255), nullable=True)  # Admin email who added this
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'added_by': self.added_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    @staticmethod
    def is_email_allowed(email: str) -> bool:
        """Check if an email is in the whitelist"""
        if not email:
            return False
        return AllowedEmail.query.filter_by(email=email.lower()).first() is not None

    @staticmethod
    def get_all_emails() -> list:
        """Get all allowed emails"""
        return [ae.email for ae in AllowedEmail.query.all()]

    @staticmethod
    def add_email(email: str, added_by: str = None) -> 'AllowedEmail':
        """Add an email to the whitelist"""
        email = email.lower().strip()
        existing = AllowedEmail.query.filter_by(email=email).first()
        if existing:
            return existing

        allowed_email = AllowedEmail(email=email, added_by=added_by)
        db.session.add(allowed_email)
        db.session.commit()
        return allowed_email

    @staticmethod
    def remove_email(email: str) -> bool:
        """Remove an email from the whitelist"""
        email = email.lower().strip()
        allowed_email = AllowedEmail.query.filter_by(email=email).first()
        if allowed_email:
            db.session.delete(allowed_email)
            db.session.commit()
            return True
        return False

    @staticmethod
    def init_from_env():
        """Initialize whitelist from environment variable (first-time setup)"""
        from flask import current_app

        # Only initialize if table is empty
        if AllowedEmail.query.count() > 0:
            return

        allowed_emails = current_app.config.get('ALLOWED_EMAILS', [])
        for email in allowed_emails:
            if email:
                AllowedEmail.add_email(email, added_by='system')

    def __repr__(self):
        return f'<AllowedEmail {self.email}>'
