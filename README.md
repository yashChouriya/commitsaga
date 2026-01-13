# CommitSaga

> Every repository tells a story through its commits. CommitSaga helps you read and understand that saga.

## What is CommitSaga?

CommitSaga is a comprehensive git repository analysis tool that transforms your repository history into meaningful insights. It analyzes commits, pull requests, and issues to help developers understand code evolution, past decisions, and contributor impact.

## Key Features

- **AI-Powered Analysis**: Uses Claude AI to generate intelligent summaries of commit groups, PRs, and issues
- **Contributor Gamification**: Impact scoring system that recognizes and ranks contributor efforts
- **Issue Archaeology**: Discover past problems and their solutions - valuable learning for new developers
- **Timeline Visualization**: Interactive visualizations showing how your codebase evolved over time
- **AI-Friendly Exports**: Generate structured markdown exports (weekly/monthly/complete) optimized for LLM consumption
- **Automated Updates**: Set up cron jobs to automatically analyze new commits on a schedule

## Tech Stack

**Backend:**
- Django 5.x + Django REST Framework
- PostgreSQL
- Celery + Redis
- PyGithub
- Anthropic Python SDK

**Frontend:**
- Next.js 16 (App Router)
- Bun runtime
- TailwindCSS
- Recharts for visualizations

## Use Cases

1. **Onboarding New Developers**: Help new team members understand the codebase evolution and past architectural decisions
2. **Knowledge Preservation**: Capture and preserve context around why code exists and what problems it solved
3. **Learning from History**: Avoid repeating past mistakes by understanding what was tried before
4. **Team Recognition**: Gamified contributor scoring to recognize and celebrate team member contributions
5. **AI Context**: Export repository history in AI-consumable format for feeding to LLMs for further analysis

## Project Structure

```
commitsaga/
├── backend/          # Django backend
├── frontend/         # Next.js frontend
├── PLAN.md          # Detailed implementation plan
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Python 3.11+
- Bun (latest)
- PostgreSQL 15+
- Redis
- GitHub Personal Access Token
- Anthropic API Key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Create database:**
   ```bash
   createdb commitsaga
   ```

6. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run development server:**
   ```bash
   python manage.py runserver
   ```

9. **Run Celery worker (in separate terminal):**
   ```bash
   celery -A config worker -l info
   ```

10. **Run Celery beat (in separate terminal):**
    ```bash
    celery -A config beat -l info
    ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run development server:**
   ```bash
   bun dev
   ```

5. **Open browser:**
   Visit [http://localhost:3000](http://localhost:3000)

### Additional Setup

**Generate encryption key for GitHub tokens:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Add this to your backend `.env` as `GITHUB_TOKEN_ENCRYPTION_KEY`

## Project Structure

```
commitsaga/
├── backend/              # Django backend
│   ├── config/          # Django settings & configuration
│   ├── apps/            # Django apps (users, repositories, analysis, ai)
│   ├── requirements.txt
│   └── manage.py
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/        # Next.js app router pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities and API client
│   │   └── types/      # TypeScript type definitions
│   └── package.json
├── PLAN.md             # Detailed implementation plan
└── CONTRIBUTOR_SCORING.md  # Scoring system documentation
```

## Implementation Status

Backend and frontend scaffolding completed. See [PLAN.md](./PLAN.md) for the detailed implementation roadmap.

---

Built with love for developers who believe every commit tells a story.
