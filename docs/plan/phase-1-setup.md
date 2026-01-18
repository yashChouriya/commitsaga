# Phase 1: Project Setup & Core Infrastructure

## Backend Setup

1. Create Django project with Django REST Framework
2. Configure PostgreSQL connection
3. Set up Celery + Redis configuration
4. Create base models (User, Repository)
5. Set up Django admin for data inspection
6. Create requirements.txt with dependencies:
   - Django 5.x
   - djangorestframework
   - psycopg2-binary
   - celery
   - redis
   - PyGithub
   - anthropic
   - python-decouple (for env vars)
   - cryptography (for token encryption)

## Frontend Setup

1. Create Next.js 16 app using `bun create next-app@latest`
2. Install dependencies:
   - TailwindCSS (already in Next.js setup)
   - shadcn/ui components
   - recharts (for charts)
   - axios or fetch wrapper
3. Set up API client utility
4. Create base layout and routing structure

## Environment Variables

- Backend: `DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`, `SECRET_KEY`
- Frontend: `NEXT_PUBLIC_API_URL`
