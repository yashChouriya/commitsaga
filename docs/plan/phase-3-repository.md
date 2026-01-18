# Phase 3: Repository Selection & Initial Fetch

## Backend API Endpoints

1. `POST /api/repositories/` - Add new repository
   - Accept: github_repo_url, selected_branch (optional)
   - Validate repo exists using PyGithub
   - Store in DB with status=pending
   - Trigger Celery task for initial analysis

2. `GET /api/repositories/` - List user's repositories
3. `GET /api/repositories/{id}/` - Get single repo details
4. `DELETE /api/repositories/{id}/` - Remove repo

## Celery Task: `fetch_repository_data`

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

## Frontend

1. Create "Add Repository" form
   - Input: GitHub repo URL
   - Optional: branch selection dropdown
2. Repository list page showing all repos with status
3. Loading states for pending analysis
