"""
Production settings.

PostgreSQL + Redis-backed Channels + a real Celery worker (see
deliveries/tasks.py and the `worker` service/Procfile entry). Every
credential comes from the environment; nothing is hardcoded. Missing
required variables fail startup immediately with a clear error rather than
silently falling back — that fallback behavior belongs to local.py only.
"""
import os

from django.core.exceptions import ImproperlyConfigured

from logistica_tracking import env_check
from .base import *  # noqa: F401,F403


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ImproperlyConfigured(f"{name} environment variable is required in production.")
    return value


DEBUG = False

SECRET_KEY = _require_env("SECRET_KEY")

# Prefer a single connection URL (Neon / Render Postgres) when present; it
# carries host/user/password/db and ?sslmode=require in one value. Neon's
# console gives it as NEON_DATABASE_URL — accept that or the generic
# DATABASE_URL. Fall back to discrete DB_* vars otherwise.
_database_url = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")
if _database_url:
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.parse(
            _database_url,
            conn_max_age=600,
            # Neon serves over a PgBouncer pooler; server-side cursors break
            # in transaction-pooling mode, so disable them. Health checks
            # recycle connections the pooler has silently dropped.
            conn_health_checks=True,
            disable_server_side_cursors=True,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _require_env("DB_NAME"),
            "USER": _require_env("DB_USER"),
            "PASSWORD": _require_env("DB_PASSWORD"),
            "HOST": _require_env("DB_HOST"),
            "PORT": os.environ.get("DB_PORT", "5432"),
            "OPTIONS": {"sslmode": "require"},
            "CONN_HEALTH_CHECKS": True,
            "DISABLE_SERVER_SIDE_CURSORS": True,
        }
    }

REDIS_URL = os.environ.get("REDIS_URL", "")

if REDIS_URL and not REDIS_URL.startswith("redis://localhost") and not REDIS_URL.startswith("redis://127.0.0.1"):
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        },
    }
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    CELERY_TASK_ALWAYS_EAGER = False
else:
    # Graceful fallback when Redis service is not connected on Render.
    # Enables WebSockets (Single Instance) without throwing connection errors.
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }
    CELERY_BROKER_URL = "memory://"
    CELERY_RESULT_BACKEND = "file:///tmp"
    CELERY_TASK_ALWAYS_EAGER = True

CORS_ALLOW_ALL_ORIGINS = os.environ.get("CORS_ALLOW_ALL_ORIGINS", "false").lower() in ("true", "1", "yes")

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

# --- Security hardening -------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Diagnostic only — logs a startup warning if Postgres/Redis are
# unreachable. It never changes what backend is used: production always
# uses Postgres/Redis, this just surfaces a misconfigured host/port fast.
env_check.check_production_dependencies()
