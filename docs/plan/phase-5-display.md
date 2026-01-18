# Phase 5: Results Display & Visualization

## Backend API Endpoints

1. `GET /api/repositories/{id}/summary/` - Overall summary
2. `GET /api/repositories/{id}/groups/` - All commit groups with summaries
3. `GET /api/repositories/{id}/contributors/` - Contributors ranked by impact
4. `GET /api/repositories/{id}/timeline/` - Timeline data for visualization
5. `GET /api/pull-requests/?repo={id}` - PRs with context
6. `GET /api/issues/?repo={id}` - Issues with resolutions

## Frontend Pages

### 1. Repository Dashboard (`/repos/{id}`)

- Overall summary card
- Repository stats (commits, contributors, PRs, issues)
- Timeline visualization (commits over time)
- Top contributors leaderboard with impact scores

### 2. Timeline View (`/repos/{id}/timeline`)

- Interactive timeline showing commit groups
- Click to expand group and see detailed summary
- Filter by date range
- Show linked PRs and issues

### 3. Contributors Page (`/repos/{id}/contributors`)

- Leaderboard with gamified scores
- Each contributor card shows:
  - Total commits
  - Impact score with breakdown
  - Recent activity
  - Badge/rank (Gold/Silver/Bronze contributor)
- Click to see contributor's specific contributions

### 4. PR Explorer (`/repos/{id}/prs`)

- List all PRs with summaries
- Show discussion highlights
- Link to related commits and issues

### 5. Issue Archaeology (`/repos/{id}/issues`)

- List issues with problem to solution flow
- Group by category (bug, feature, performance)
- Show code changes that fixed each issue
- Searchable and filterable

## Visualization Components

- Timeline chart (commits over time)
- Contributor impact chart (bar/pie chart)
- Activity heatmap (contribution frequency)
- PR/Issue status distribution

## Export Functionality

### Export Page (`/repos/{id}/export`)

- Select export type (Weekly/Monthly/Complete)
- Select date range (if weekly/monthly)
- Generate markdown button
- Download generated markdown files
- History of past exports

## Backend API Endpoints for Export

1. `POST /api/repositories/{id}/export/` - Create new export
   - Parameters: export_type, date_range_start, date_range_end
   - Generates markdown file
   - Returns download URL
2. `GET /api/repositories/{id}/exports/` - List all exports for repo
3. `GET /api/exports/{id}/download/` - Download markdown file

## Celery Task: `generate_markdown_export`

- Input: repository_id, export_type, date_range
- Steps:
  1. Fetch data based on export_type and date range
  2. Generate structured markdown with sections:
     - Repository Overview (name, owner, branch, stats)
     - Time Period & Scope
     - Overall Summary (if complete export)
     - Commit Groups (chronological)
     - Pull Requests
     - Issues
     - Contributors
  3. Save markdown to file system
  4. Store Export record in DB
  5. Return file path
