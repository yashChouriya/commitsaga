# CommitSaga - Contributor Scoring System

## Overview
Contributors are scored out of 100% based on multiple weighted criteria. Each contributor also receives an AI-generated summary describing their unique contributions and role in the project.

## Scoring Criteria (Total: 100 points)

### 1. Commit Volume (20 points)
**What it measures:** Quantity of meaningful commits

**Calculation:**
- Normalize commits across all contributors
- Top contributor gets 20 points
- Others scaled proportionally
- Formula: `(contributor_commits / max_commits) * 20`

**Why it matters:** Shows consistent engagement and activity level

---

### 2. Code Impact (25 points)
**What it measures:** Actual code changes (additions + meaningful modifications)

**Calculation:**
- Calculate net impact: `additions + (deletions * 0.5)`
- Weight recent changes higher (last 3 months: 1.5x, 3-6 months: 1.2x, older: 1.0x)
- Normalize across contributors
- Formula: `(contributor_impact / max_impact) * 25`

**Why it matters:** Large refactors and feature additions deserve recognition

**Special handling:**
- Discount automated changes (package-lock.json, build files)
- Cap single commit impact to prevent skewing (max 5000 lines)

---

### 3. Pull Request Quality (20 points)
**What it measures:** Quality and success of PRs

**Sub-metrics:**
- **Merged PRs** (12 points): `(merged_prs / max_merged_prs) * 12`
- **PR Review Participation** (5 points): Comments and reviews on others' PRs
- **PR Discussion Quality** (3 points): Meaningful discussions, not just approvals

**Why it matters:** Shows collaboration and code review engagement

---

### 4. Issue Resolution (15 points)
**What it measures:** Problem-solving and bug fixing

**Calculation:**
- Weight by issue complexity/labels:
  - `bug`: 1.0x
  - `critical/high-priority`: 1.5x
  - `feature`: 1.2x
  - `documentation`: 0.8x
- Formula: `(weighted_issues_resolved / max_weighted_issues) * 15`

**Why it matters:** Fixing bugs and resolving issues is crucial work

---

### 5. Consistency (10 points)
**What it measures:** Regular, sustained contributions over time

**Calculation:**
- Calculate "active weeks" (weeks with at least 1 commit)
- Divide by total weeks in analysis period
- Formula: `(active_weeks / total_weeks) * 10`
- Minimum 4 weeks of data required

**Why it matters:** Consistent contributors keep projects moving forward

**Example:**
- 20 active weeks out of 24 total = 8.3 points
- 8 active weeks out of 24 total = 3.3 points

---

### 6. Collaboration & Communication (10 points)
**What it measures:** Team interaction and knowledge sharing

**Sub-metrics:**
- **PR Reviews Given** (4 points): Number and quality of code reviews
- **Issue Discussion Participation** (3 points): Helpful comments on issues
- **Documentation Contributions** (3 points): READMEs, docs, code comments

**Calculation:**
- Normalize each sub-metric across contributors
- Sum to get total collaboration score

**Why it matters:** Great contributors help others succeed

---

## Score Calculation Example

**Contributor: @johndoe**

| Criterion | Raw Data | Normalized | Points | Max Points |
|-----------|----------|------------|--------|------------|
| Commit Volume | 145 commits | Top contributor | 20.0 | 20 |
| Code Impact | 12,450 lines (weighted) | 85% of max | 21.3 | 25 |
| PR Quality | 18 PRs merged, 12 reviews | 90% of max | 18.0 | 20 |
| Issue Resolution | 8 issues (weighted: 10.2) | 70% of max | 10.5 | 15 |
| Consistency | 18 of 24 weeks active | 75% | 7.5 | 10 |
| Collaboration | 12 reviews, 25 comments | 80% of max | 8.0 | 10 |

**Total Score: 85.3 / 100**

---

## Badge System

Based on total score, contributors earn badges:

- **🏆 Gold Contributor**: 80-100 points
- **🥈 Silver Contributor**: 60-79 points
- **🥉 Bronze Contributor**: 40-59 points
- **⭐ Rising Star**: 20-39 points (especially for new contributors)
- **👋 New Contributor**: 0-19 points

Additional special badges:
- **🐛 Bug Hunter**: Highest issue resolution score
- **🔍 Code Reviewer**: Most PR reviews given
- **📚 Documentarian**: Highest documentation contributions
- **🚀 Impact Player**: Highest code impact score
- **⚡ Consistent Contributor**: Highest consistency score

---

## AI-Generated Contributor Summary

For each contributor, Claude AI generates a natural language summary based on their metrics and actual contributions.

### AI Prompt Template:

```
Analyze this contributor's activity for the repository:

Contributor: @{username}
Time Period: {start_date} to {end_date}

Metrics:
- Total Commits: {commits}
- Code Impact: {lines_added} additions, {lines_deleted} deletions
- PRs Merged: {prs_merged}
- Issues Resolved: {issues_resolved}
- Consistency: Active {active_weeks}/{total_weeks} weeks
- Reviews Given: {reviews_count}

Top Commits:
{list of top 5 most impactful commits with messages}

Key Pull Requests:
{list of major PRs with titles}

Issues Resolved:
{list of key issues closed}

Generate a 2-3 sentence summary describing this contributor's role and impact. Focus on:
1. Their primary contributions (features, fixes, reviews, etc.)
2. Their unique strengths or focus areas
3. How they helped the project

Format: Natural, appreciative tone. Be specific about their work.
```

### Example AI-Generated Summaries:

**@johndoe (Score: 85.3/100)** 🏆
> John was a core contributor who led the authentication system rewrite and fixed critical security vulnerabilities. His thorough code reviews and detailed feedback helped maintain high code quality across 18 pull requests. He consistently showed up week after week, making him a reliable force for the project.

**@janedoe (Score: 72.5/100)** 🥈
> Jane specialized in frontend performance optimizations, reducing bundle size by 40% and improving load times significantly. She actively participated in design discussions and helped onboard new contributors through clear documentation. Her consistency and collaborative approach made her invaluable to the team.

**@newcomer (Score: 35.2/100)** ⭐
> Alex joined mid-project and quickly made an impact by tackling several long-standing UI bugs and improving the mobile experience. Though newer to the team, their attention to detail and willingness to learn shows great promise. They've been actively engaging in PR reviews to understand the codebase better.

---

## Database Schema Updates

Update the `Contributor` model to include:

```python
class Contributor(models.Model):
    # Existing fields
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE)
    github_username = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)

    # Score breakdown (out of 100)
    total_score = models.DecimalField(max_digits=5, decimal_places=2)  # e.g., 85.30
    commit_volume_score = models.DecimalField(max_digits=4, decimal_places=2)  # max 20
    code_impact_score = models.DecimalField(max_digits=4, decimal_places=2)  # max 25
    pr_quality_score = models.DecimalField(max_digits=4, decimal_places=2)  # max 20
    issue_resolution_score = models.DecimalField(max_digits=4, decimal_places=2)  # max 15
    consistency_score = models.DecimalField(max_digits=4, decimal_places=2)  # max 10
    collaboration_score = models.DecimalField(max_digits=4, decimal_places=2)  # max 10

    # Raw metrics
    total_commits = models.IntegerField(default=0)
    lines_added = models.IntegerField(default=0)
    lines_deleted = models.IntegerField(default=0)
    prs_merged = models.IntegerField(default=0)
    prs_reviewed = models.IntegerField(default=0)
    issues_resolved = models.IntegerField(default=0)
    active_weeks = models.IntegerField(default=0)

    # AI-generated content
    ai_summary = models.TextField(blank=True)  # AI-generated summary

    # Badges
    primary_badge = models.CharField(max_length=50)  # Gold/Silver/Bronze/Rising Star/New
    special_badges = models.JSONField(default=list)  # ["Bug Hunter", "Code Reviewer"]

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## API Response Format

**GET /api/repositories/{id}/contributors/**

```json
{
  "contributors": [
    {
      "id": 1,
      "github_username": "johndoe",
      "total_score": 85.30,
      "score_breakdown": {
        "commit_volume": 20.0,
        "code_impact": 21.3,
        "pr_quality": 18.0,
        "issue_resolution": 10.5,
        "consistency": 7.5,
        "collaboration": 8.0
      },
      "metrics": {
        "total_commits": 145,
        "lines_added": 15200,
        "lines_deleted": 2750,
        "prs_merged": 18,
        "prs_reviewed": 12,
        "issues_resolved": 8,
        "active_weeks": 18,
        "total_weeks": 24
      },
      "ai_summary": "John was a core contributor who led the authentication system rewrite...",
      "primary_badge": "Gold Contributor",
      "special_badges": ["Bug Hunter", "Impact Player"],
      "rank": 1
    }
  ],
  "total_contributors": 8,
  "analysis_period": {
    "start": "2024-01-01",
    "end": "2024-06-30"
  }
}
```

---

## UI Display

### Contributor Leaderboard Card

```
┌─────────────────────────────────────────────────────────┐
│ 🏆 #1 @johndoe                           Score: 85.3/100│
│                                                           │
│ John was a core contributor who led the authentication   │
│ system rewrite and fixed critical security               │
│ vulnerabilities...                                        │
│                                                           │
│ Commit Volume    ████████████████████ 20.0               │
│ Code Impact      █████████████████▌   21.3               │
│ PR Quality       ██████████████████   18.0               │
│ Issue Resolution ██████████▌          10.5               │
│ Consistency      ███████▌              7.5               │
│ Collaboration    ████████              8.0               │
│                                                           │
│ Badges: 🏆 Gold | 🐛 Bug Hunter | 🚀 Impact Player      │
│                                                           │
│ 145 commits • 18 PRs • 8 issues • Active 18/24 weeks    │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation in Celery Task

Update `generate_ai_summaries` task to:

1. Calculate all raw metrics for each contributor
2. Normalize and score across all contributors
3. Assign badges based on scores
4. Generate AI summary for each contributor
5. Store all data in Contributor model

This ensures fair, transparent, and meaningful recognition of everyone's contributions.
