# CommitSaga - Overview

## Project Overview

CommitSaga is a tool that analyzes git repository history (commits, PRs, issues) to help developers understand code evolution, past decisions, and contributor impact. Provides AI-generated summaries, gamified contributor scoring, and AI-friendly markdown exports.

**Name Origin:** "CommitSaga" - Every repository tells a story through its commits. This tool helps you read and understand that saga.

## Tech Stack

### Backend

- **Framework**: Django 5.x + Django REST Framework
- **Database**: PostgreSQL
- **Task Queue**: Celery + Redis (for background processing and cron jobs)
- **Git Integration**: PyGithub library
- **AI**: Anthropic Python SDK (Claude API)
- **Auth**: Django Token Authentication (for PAT storage)

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun (package manager and runtime)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (optional, for quick UI)
- **Charts**: Recharts or Chart.js (for visualizations)

### Infrastructure

- **Database**: PostgreSQL 15+
- **Cache/Queue**: Redis
- **API Communication**: REST (Django REST Framework)

## Project Structure

```
commitsaga/
├── backend/                    # Django project
│   ├── manage.py
│   ├── config/                 # Django settings
│   │   ├── settings.py
│   │   ├── celery.py
│   │   └── urls.py
│   ├── apps/
│   │   ├── repositories/       # Repo models and logic
│   │   ├── analysis/          # Git data analysis
│   │   ├── ai/                # Claude AI integration
│   │   └── users/             # User auth and PAT storage
│   ├── requirements.txt
│   └── .env
│
└── frontend/                   # Next.js 16 project
    ├── src/
    │   ├── app/               # App Router pages
    │   │   ├── page.tsx       # Home/landing
    │   │   ├── repos/         # Repo list and details
    │   │   └── analysis/      # Analysis results
    │   ├── components/        # React components
    │   ├── lib/              # API client, utilities
    │   └── types/            # TypeScript types
    ├── package.json
    └── .env.local
```

## Database Schema

### Core Models

#### User

- id (PK)
- email
- username
- github_token (encrypted)
- created_at
- updated_at

#### Repository

- id (PK)
- user_id (FK to User)
- github_repo_url
- repo_name
- owner
- default_branch (main/master)
- selected_branch (user selected or default)
- last_analyzed_at
- analysis_status (pending/in_progress/completed/failed)
- cron_enabled (boolean)
- cron_frequency (weekly/monthly)
- created_at
- updated_at

#### Contributor

- id (PK)
- repository_id (FK to Repository)
- github_username
- email
- total_commits
- impact_score (gamification points)
- created_at
- updated_at

#### CommitGroup

- id (PK)
- repository_id (FK to Repository)
- group_type (weekly/monthly)
- start_date
- end_date
- commit_count
- summary (AI-generated text)
- key_changes (JSON array)
- analyzed_at
- created_at
- updated_at

#### CommitData

- id (PK)
- commit_group_id (FK to CommitGroup)
- contributor_id (FK to Contributor)
- commit_sha
- commit_message
- commit_date
- files_changed (JSON array)
- additions
- deletions
- created_at

#### PullRequest

- id (PK)
- repository_id (FK to Repository)
- pr_number
- title
- description
- author (github_username)
- state (open/closed/merged)
- created_at_github
- merged_at
- discussion (JSON - comments)
- commit_shas (JSON array)

#### Issue

- id (PK)
- repository_id (FK to Repository)
- issue_number
- title
- description
- state (open/closed)
- labels (JSON array)
- created_at_github
- closed_at
- resolution_pr_id (FK to PullRequest, nullable)
- discussion (JSON - comments)

#### OverallSummary

- id (PK)
- repository_id (FK to Repository)
- summary_text (AI-generated overall summary)
- total_commits
- total_contributors
- analysis_period_start
- analysis_period_end
- generated_at
- created_at
- updated_at

#### Export

- id (PK)
- repository_id (FK to Repository)
- export_type (weekly/monthly/complete)
- date_range_start (nullable for complete export)
- date_range_end (nullable for complete export)
- file_path (path to generated markdown file)
- file_size (bytes)
- created_at
- updated_at

## Key Implementation Considerations

### GitHub API Rate Limiting

- GitHub allows 5,000 requests/hour with authentication
- For large repos, batch requests and cache aggressively
- Show progress during long-running analysis

### AI Cost Management

- Use Claude Haiku for individual commit group summaries (cheaper)
- Use Claude Sonnet only for overall summary (more nuanced)
- Estimate: ~$0.10-$1.00 per repo analysis depending on size

### Data Storage

- Large repos may have 10,000+ commits
- Store commit data efficiently (JSON fields for file changes)
- Consider data retention policy (archive old analyses?)

### Security

- Encrypt GitHub tokens at rest
- Use HTTPS only
- Validate all GitHub URLs to prevent injection
- Rate limit API endpoints

## Testing Strategy

### Backend Tests

1. Unit tests for models
2. Integration tests for PyGithub data fetching
3. Test AI prompt/response parsing
4. Test Celery task execution
5. API endpoint tests

### Frontend Tests

1. Component unit tests
2. Integration tests for API calls
3. E2E tests for critical flows (add repo, view analysis)

## Deployment Checklist

1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure Celery workers
4. Set environment variables
5. Run migrations: `python manage.py migrate`
6. Create superuser: `python manage.py createsuperuser`
7. Collect static files: `python manage.py collectstatic`
8. Start services:
   - Django: `gunicorn config.wsgi:application`
   - Celery worker: `celery -A config worker -l info`
   - Celery beat: `celery -A config beat -l info`
   - Frontend: `bun run build && bun start`

## Future Enhancements (Out of Scope for MVP)

- Multi-repo comparison
- Team analytics (if GitHub org)
- Code change visualization (diff viewer)
- Export reports as PDF
- Slack/Discord notifications
- GitHub App instead of PAT (better UX)
- Real-time analysis progress updates (WebSockets)
- AI chat to ask questions about repo history

## Success Metrics

- Successfully analyze a repository end-to-end
- Generate meaningful AI summaries that provide insights
- Contributor scores reflect actual impact
- Issue archaeology shows problem-solution connections
- Cron jobs run reliably for incremental updates
- Export generates well-formatted, AI-consumable markdown
- Frontend is responsive and intuitive
