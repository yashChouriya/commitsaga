# Phase 4: Data Grouping & Analysis

## Celery Task: `analyze_repository_data`

- Input: repository_id
- Steps:
  1. Group commits by week/month (configurable)
  2. For each group:
     - Collect all commit messages
     - Create CommitData records
     - Link to contributors
  3. Store CommitGroup records
  4. Trigger AI summarization task

## Celery Task: `generate_ai_summaries`

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
     - Assign badges: Gold (80-100), Silver (60-79), Bronze (40-59), Rising Star (20-39)
     - Special badges: Bug Hunter, Code Reviewer, Documentarian, Impact Player, Consistent Contributor
     - Store in Contributor model with score breakdown
  3. Generate overall repository summary:
     - Aggregate all CommitGroup summaries
     - Include top contributors
     - Major milestones and features
     - Store in OverallSummary
  4. Update repository status to "completed"

## AI Prompt Structure (Claude)

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
