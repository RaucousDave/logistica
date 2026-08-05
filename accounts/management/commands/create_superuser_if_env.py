"""
Management command to create a superuser if the DJANGO_SUPERUSER_* env
vars are set. Idempotent — safe to run on every deploy; only creates the
user if it doesn't already exist.

Usage (production deploy):
    python manage.py create_superuser_if_env

Set these environment variables on Render:
    DJANGO_SUPERUSER_USERNAME=admin
    DJANGO_SUPERUSER_EMAIL=you@example.com
    DJANGO_SUPERUSER_PASSWORD=your-secure-password
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create superuser from env vars if they exist (idempotent)"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not all([username, email, password]):
            self.stdout.write(
                self.style.WARNING(
                    "DJANGO_SUPERUSER_* env vars not set; skipping superuser creation."
                )
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.SUCCESS(f"Superuser '{username}' already exists; nothing to do.")
            )
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created successfully."))
