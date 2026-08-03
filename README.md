# logistica

Real-time logistics / delivery-tracking backend built with Django REST Framework,
JWT auth, and Django Channels (WebSockets).

## Deploy (Render)

- **Root Directory:** `.` (project is at the repo root)
- **Settings module:** `DJANGO_SETTINGS_MODULE=logistica_tracking.settings.production`
- **Required env vars:** `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`,
  `DB_PORT`, `REDIS_URL`, `CORS_ALLOWED_ORIGINS`, `DJANGO_ALLOWED_HOSTS`
- **Web:** `daphne -b 0.0.0.0 -p $PORT logistica_tracking.asgi:application`
- **Worker:** `celery -A logistica_tracking worker --loglevel=info`

See `.env.example` for the full list of environment variables.
