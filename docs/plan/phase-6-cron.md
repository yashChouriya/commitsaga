# Phase 6: Cron Jobs & Incremental Updates

## Backend

1. Add cron configuration to Repository model
2. Celery Beat setup for scheduled tasks
3. Create `update_repository_incremental` task:
   - Fetch only new commits since last_analyzed_at
   - Fetch new PRs and issues
   - Create new CommitGroup for the new period
   - Re-generate AI summary for new group only
   - Update contributor scores
   - Update overall summary (append new insights)

## Frontend

1. Repository settings page:
   - Toggle cron enabled/disabled
   - Select frequency (weekly/monthly)
   - Show last analysis date
   - Manual "Re-analyze" button
2. Notifications for new analysis completion
