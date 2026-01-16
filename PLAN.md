# CommitSaga - Implementation Plan

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

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure

**Backend Setup:**

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

**Frontend Setup:**

1. Create Next.js 16 app using `bun create next-app@latest`
2. Install dependencies:
   - TailwindCSS (already in Next.js setup)
   - shadcn/ui components
   - recharts (for charts)
   - axios or fetch wrapper
3. Set up API client utility
4. Create base layout and routing structure

**Environment Variables:**

- Backend: `DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`, `SECRET_KEY`
- Frontend: `NEXT_PUBLIC_API_URL`

### Phase 2: Authentication & GitHub Integration

**Backend:**

1. Create User registration/login endpoints
2. Store GitHub Personal Access Token (encrypted) per user
3. Create endpoint to validate GitHub token
4. Test PyGithub connection with stored tokens

**Frontend:**

1. Create login/signup pages
2. Create settings page for GitHub PAT input
3. Form to add/update GitHub token
4. Token validation UI

### Phase 3: Repository Selection & Initial Fetch

**Backend API Endpoints:**

1. `POST /api/repositories/` - Add new repository

   - Accept: github_repo_url, selected_branch (optional)
   - Validate repo exists using PyGithub
   - Store in DB with status=pending
   - Trigger Celery task for initial analysis

2. `GET /api/repositories/` - List user's repositories
3. `GET /api/repositories/{id}/` - Get single repo details
4. `DELETE /api/repositories/{id}/` - Remove repo

**Celery Task: `fetch_repository_data`**

- Input: repository_id
- Steps:
  1. Get repo using PyGithub
  2. Fetch all branches, confirm selected_branch exists
  3. Fetch all contributors
  4. Store contributors in DB
  5. Fetch all commits from selected_branch
  6. Fetch all PRs (with discussions)
  7. Fetch all issues (with discussions)
  8. Store raw data in DB
  9. Update repository status to "fetched"
  10. Trigger next task: `analyze_repository_data`

**Frontend:**

1. Create "Add Repository" form
   - Input: GitHub repo URL
   - Optional: branch selection dropdown
2. Repository list page showing all repos with status
3. Loading states for pending analysis

### Phase 4: Data Grouping & Analysis

**Celery Task: `analyze_repository_data`**

- Input: repository_id
- Steps:
  1. Group commits by week/month (configurable)
  2. For each group:
     - Collect all commit messages
     - Create CommitData records
     - Link to contributors
  3. Store CommitGroup records
  4. Trigger AI summarization task

**Celery Task: `generate_ai_summaries`**

- Input: repository_id
- Steps:
  1. For each CommitGroup:
     - Prepare prompt with all commits in group
     - Include PR descriptions linked to those commits
     - Include related issues
     - Call Claude API for structured summary
     - Parse response and store in CommitGroup.summary
  2. Calculate contributor impact scores (Total: 100 points):
     - **Commit Volume** (20 points): Quantity of meaningful commits
     - **Code Impact** (25 points): Lines changed, weighted by recency
     - **PR Quality** (20 points): Merged PRs, review participation, discussion quality
     - **Issue Resolution** (15 points): Issues resolved, weighted by complexity/labels
     - **Consistency** (10 points): Active weeks over analysis period
     - **Collaboration** (10 points): Reviews given, issue discussions, documentation
     - Assign badges: 🏆 Gold (80-100), 🥈 Silver (60-79), 🥉 Bronze (40-59), ⭐ Rising Star (20-39)
     - Special badges: Bug Hunter, Code Reviewer, Documentarian, Impact Player, Consistent Contributor
     - Store in Contributor model with score breakdown
  3. Generate overall repository summary:
     - Aggregate all CommitGroup summaries
     - Include top contributors
     - Major milestones and features
     - Store in OverallSummary
  4. Update repository status to "completed"

**AI Prompt Structure (Claude):**

```
Analyze this group of commits from [start_date] to [end_date]:

Commits:
[List of commit messages with authors]

Related Pull Requests:
[PR titles and descriptions]

Related Issues:
[Issue titles and resolutions]

Provide a structured summary:
1. Key Changes: What was accomplished?
2. Notable Features: New functionality added?
3. Bug Fixes: What issues were resolved?
4. Technical Decisions: Any architectural changes?
5. Contributors: Who were the main contributors?

Format as JSON:
{
  "summary": "Brief paragraph summary",
  "key_changes": ["change 1", "change 2"],
  "notable_features": ["feature 1"],
  "bug_fixes": ["fix 1"],
  "technical_decisions": ["decision 1"],
  "main_contributors": ["username1", "username2"]
}
```

### Phase 5: Results Display & Visualization

**Backend API Endpoints:**

1. `GET /api/repositories/{id}/summary/` - Overall summary
2. `GET /api/repositories/{id}/groups/` - All commit groups with summaries
3. `GET /api/repositories/{id}/contributors/` - Contributors ranked by impact
4. `GET /api/repositories/{id}/timeline/` - Timeline data for visualization
5. `GET /api/pull-requests/?repo={id}` - PRs with context
6. `GET /api/issues/?repo={id}` - Issues with resolutions

**Frontend Pages:**

1. **Repository Dashboard** (`/repos/{id}`)

   - Overall summary card
   - Repository stats (commits, contributors, PRs, issues)
   - Timeline visualization (commits over time)
   - Top contributors leaderboard with impact scores

2. **Timeline View** (`/repos/{id}/timeline`)

   - Interactive timeline showing commit groups
   - Click to expand group and see detailed summary
   - Filter by date range
   - Show linked PRs and issues

3. **Contributors Page** (`/repos/{id}/contributors`)

   - Leaderboard with gamified scores
   - Each contributor card shows:
     - Total commits
     - Impact score with breakdown
     - Recent activity
     - Badge/rank (Gold/Silver/Bronze contributor)
   - Click to see contributor's specific contributions

4. **PR Explorer** (`/repos/{id}/prs`)

   - List all PRs with summaries
   - Show discussion highlights
   - Link to related commits and issues

5. **Issue Archaeology** (`/repos/{id}/issues`)
   - List issues with problem → solution flow
   - Group by category (bug, feature, performance)
   - Show code changes that fixed each issue
   - Searchable and filterable

**Visualization Components:**

- Timeline chart (commits over time)
- Contributor impact chart (bar/pie chart)
- Activity heatmap (contribution frequency)
- PR/Issue status distribution

**Export Functionality:**

6. **Export Page** (`/repos/{id}/export`)
   - Select export type (Weekly/Monthly/Complete)
   - Select date range (if weekly/monthly)
   - Generate markdown button
   - Download generated markdown files
   - History of past exports

**Backend API Endpoints for Export:**

1. `POST /api/repositories/{id}/export/` - Create new export
   - Parameters: export_type, date_range_start, date_range_end
   - Generates markdown file
   - Returns download URL
2. `GET /api/repositories/{id}/exports/` - List all exports for repo
3. `GET /api/exports/{id}/download/` - Download markdown file

**Celery Task: `generate_markdown_export`**

- Input: repository_id, export_type, date_range
- Steps:
  1. Fetch data based on export_type and date range
  2. Generate structured markdown with sections:
     - Repository Overview (name, owner, branch, stats)
     - Time Period & Scope
     - Overall Summary (if complete export)
     - Commit Groups (chronological)
       - Period (e.g., "Week of Jan 1-7, 2024")
       - Summary
       - Key commits with messages
       - Files changed highlights
     - Pull Requests
       - PR title, description, discussion highlights
       - Status and merge date
       - Linked commits
     - Issues
       - Issue title, description
       - Problem → Solution flow
       - Resolution PR link
     - Contributors
       - Username, impact score
       - Contribution summary
  3. Save markdown to file system
  4. Store Export record in DB
  5. Return file path

**Markdown Format Example:**

```markdown
# CommitSaga Analysis Export

## Repository: owner/repo-name

**Branch:** main
**Export Type:** Monthly
**Period:** January 2024
**Generated:** 2024-01-31 10:00:00 UTC

---

## Repository Overview

- **Total Commits:** 145
- **Contributors:** 8
- **Pull Requests:** 23 (21 merged, 2 open)
- **Issues Resolved:** 15

## Summary

This month focused on implementing the new authentication system and fixing performance issues...

---

## Week 1: Jan 1-7, 2024

### Summary

Team implemented JWT authentication and migrated from session-based auth...

### Key Commits

- `abc123` - Add JWT token generation (by @john)
- `def456` - Implement token refresh endpoint (by @jane)
- `ghi789` - Update auth middleware (by @john)

### Files Changed

- `auth/jwt.py` (+250, -0)
- `middleware/auth.py` (+45, -120)
- `tests/test_auth.py` (+80, -0)

---

## Pull Requests

### PR #45: Implement JWT Authentication

**Author:** @john
**Status:** Merged on Jan 5, 2024
**Discussion Highlights:**

- Security review completed by @security-team
- Performance benchmarks show 20% improvement
- Decided to use RS256 algorithm over HS256

**Changes:**

- Added JWT token generation
- Implemented refresh token mechanism
- Updated API documentation

---

## Issues

### Issue #123: Slow login performance

**Status:** Closed
**Resolution:** PR #45

**Problem:**
Login endpoint taking 2-3 seconds under load...

**Solution:**
Switched to JWT tokens, eliminating database lookups on every request...

---

## Contributors

### @john (Impact Score: 850)

- 42 commits
- 3 PRs merged
- Led JWT authentication implementation
- Fixed 2 critical bugs

### @jane (Impact Score: 620)

- 28 commits
- 2 PRs merged
- Implemented token refresh mechanism
```

This format is optimized for AI consumption - structured, clear sections, and includes context around decisions.

### Phase 6: Cron Jobs & Incremental Updates

**Backend:**

1. Add cron configuration to Repository model
2. Celery Beat setup for scheduled tasks
3. Create `update_repository_incremental` task:
   - Fetch only new commits since last_analyzed_at
   - Fetch new PRs and issues
   - Create new CommitGroup for the new period
   - Re-generate AI summary for new group only
   - Update contributor scores
   - Update overall summary (append new insights)

**Frontend:**

1. Repository settings page:
   - Toggle cron enabled/disabled
   - Select frequency (weekly/monthly)
   - Show last analysis date
   - Manual "Re-analyze" button
2. Notifications for new analysis completion

### Phase 7: Performance & Polish

**Backend Optimizations:**

1. Add database indexes:
   - Repository.user_id
   - CommitData.commit_group_id
   - Contributor.repository_id
2. Implement caching for expensive queries (Redis)
3. Paginate API responses
4. Add rate limiting for GitHub API calls
5. Handle GitHub API errors gracefully

**Frontend Optimizations:**

1. Implement loading skeletons
2. Add error boundaries
3. Optimize data fetching with React Server Components
4. Add search and filtering
5. Mobile responsive design

**Error Handling:**

- Invalid GitHub tokens
- Rate limit exceeded
- Repository not found
- Analysis failures (log and show to user)

## Key Implementation Considerations

### GitHub API Rate Limiting

- GitHub allows 5,000 requests/hour with authentication
- For large repos, batch requests and cache aggressively
- Show progress during long-running analysis

### AI Cost Management

- Use Claude Haiku for individual commit group summaries (cheaper)
- Use Claude Sonnet only for overall summary (more nuanced)
- Estimate: ~$0.10-$1.00 per repo analysis depending on size
- Show cost estimate before analysis?

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
