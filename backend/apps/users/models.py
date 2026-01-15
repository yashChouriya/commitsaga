import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from cryptography.fernet import Fernet
from django.conf import settings


class User(AbstractUser):
    """Custom user model with GitHub PAT storage"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    github_token = models.TextField(blank=True, null=True, help_text="Encrypted GitHub Personal Access Token")
    github_username = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def set_github_token(self, token: str) -> None:
        """Encrypt and store GitHub token"""
        if not token:
            self.github_token = None
            return

        encryption_key = settings.GITHUB_TOKEN_ENCRYPTION_KEY
        if not encryption_key:
            raise ValueError("GITHUB_TOKEN_ENCRYPTION_KEY not configured")

        fernet = Fernet(encryption_key.encode())
        encrypted_token = fernet.encrypt(token.encode())
        self.github_token = encrypted_token.decode()

    def get_github_token(self) -> str | None:
        """Decrypt and return GitHub token"""
        if not self.github_token:
            return None

        encryption_key = settings.GITHUB_TOKEN_ENCRYPTION_KEY
        if not encryption_key:
            raise ValueError("GITHUB_TOKEN_ENCRYPTION_KEY not configured")

        try:
            fernet = Fernet(encryption_key.encode())
            decrypted_token = fernet.decrypt(self.github_token.encode())
            return decrypted_token.decode()
        except Exception:
            return None

    @property
    def has_github_token(self) -> bool:
        """Check if user has a GitHub token configured"""
        return bool(self.github_token)
