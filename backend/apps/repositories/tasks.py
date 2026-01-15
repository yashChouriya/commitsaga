"""
Celery tasks for repository data fetching and processing.
"""

import logging
from datetime import datetime, timezone, timedelta
from celery import shared_task
from django.db import transaction
from django.db.models import Sum, Count
from github import Github, GithubException

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def fetch_repository_data(self, repository_id: str):
    """
    Fetch all repository data from GitHub.

    This task:
    1. Fetches repository metadata
    2. Fetches all contributors
    3. Fetches all commits from selected branch
    4. Fetches all pull requests with comments
    5. Fetches all issues with comments
    """
    from .models import (
        Repository,
        Contributor,
        CommitData,
        PullRequest,
        Issue,
    )

    try:
        repository = Repository.objects.get(id=repository_id)
    except Repository.DoesNotExist:
        logger.error(f"Repository {repository_id} not found")
        return

    # Update status to fetching
    repository.analysis_status = Repository.AnalysisStatus.FETCHING
    repository.analysis_error = None
    repository.save()

    try:
        # Get GitHub token from user
        github_token = repository.user.get_github_token()
        if not github_token:
            raise ValueError("GitHub token not configured for user")

        g = Github(github_token)
        github_repo = g.get_repo(repository.full_name)

        # Update repository metadata
        repository.description = github_repo.description or ""
        repository.default_branch = github_repo.default_branch
        repository.stars_count = github_repo.stargazers_count
        repository.forks_count = github_repo.forks_count
        repository.open_issues_count = github_repo.open_issues_count
        repository.save()

        branch = repository.branch

        # Fetch contributors
        logger.info(f"Fetching contributors for {repository.full_name}")
        _fetch_contributors(repository, github_repo)

        # Fetch commits
        logger.info(f"Fetching commits for {repository.full_name} on branch {branch}")
        _fetch_commits(repository, github_repo, branch)

        # Fetch pull requests
        logger.info(f"Fetching pull requests for {repository.full_name}")
        _fetch_pull_requests(repository, github_repo)

        # Fetch issues
        logger.info(f"Fetching issues for {repository.full_name}")
        _fetch_issues(repository, github_repo)

        logger.info(f"Successfully fetched data for {repository.full_name}")

        # Trigger analysis task (will group commits and generate AI summaries)
        analyze_repository_data.delay(repository_id)

    except GithubException as e:
        logger.error(f"GitHub API error for {repository.full_name}: {e}")
        repository.analysis_status = Repository.AnalysisStatus.FAILED
        repository.analysis_error = f"GitHub API error: {str(e)}"
        repository.save()

        # Retry on rate limit errors
        if e.status == 403 and "rate limit" in str(e).lower():
            raise self.retry(exc=e)

    except Exception as e:
        logger.error(f"Error fetching data for {repository.full_name}: {e}")
        repository.analysis_status = Repository.AnalysisStatus.FAILED
        repository.analysis_error = str(e)
        repository.save()
        raise


def _fetch_contributors(repository, github_repo):
    """Fetch and store contributors for a repository."""
    from .models import Contributor

    contributors_data = []

    try:
        for contributor in github_repo.get_contributors():
            contributors_data.append(
                {
                    "github_username": contributor.login,
                    "github_id": contributor.id,
                    "avatar_url": contributor.avatar_url,
                    "email": contributor.email,
                    "total_commits": contributor.contributions,
                }
            )
    except GithubException as e:
        logger.warning(f"Could not fetch contributors: {e}")
        return

    with transaction.atomic():
        for data in contributors_data:
            Contributor.objects.update_or_create(
                repository=repository,
                github_username=data["github_username"],
                defaults={
                    "github_id": data["github_id"],
                    "avatar_url": data["avatar_url"],
                    "email": data["email"],
                    "total_commits": data["total_commits"],
                },
            )


def _fetch_commits(repository, github_repo, branch: str, limit: int = 500):
    """Fetch and store commits for a repository."""
    from .models import CommitData, Contributor

    commits_data = []

    try:
        commits = github_repo.get_commits(sha=branch)
        for i, commit in enumerate(commits):
            if i >= limit:
                break

            # Get commit details
            commit_data = {
                "commit_sha": commit.sha,
                "commit_message": commit.commit.message,
                "commit_date": commit.commit.author.date,
                "author_name": commit.commit.author.name,
                "author_email": commit.commit.author.email,
                "additions": commit.stats.additions if commit.stats else 0,
                "deletions": commit.stats.deletions if commit.stats else 0,
                "author_login": commit.author.login if commit.author else None,
            }

            # Get files changed (limit to avoid huge payloads)
            try:
                files_changed = []
                for f in commit.files[:20]:  # Limit to 20 files per commit
                    files_changed.append(
                        {
                            "filename": f.filename,
                            "additions": f.additions,
                            "deletions": f.deletions,
                            "status": f.status,
                        }
                    )
                commit_data["files_changed"] = files_changed
            except Exception:
                commit_data["files_changed"] = []

            commits_data.append(commit_data)

    except GithubException as e:
        logger.warning(f"Could not fetch commits: {e}")
        return

    with transaction.atomic():
        for data in commits_data:
            # Try to link to contributor
            contributor = None
            if data.get("author_login"):
                contributor = Contributor.objects.filter(
                    repository=repository, github_username=data["author_login"]
                ).first()

            CommitData.objects.update_or_create(
                repository=repository,
                commit_sha=data["commit_sha"],
                defaults={
                    "commit_message": data["commit_message"],
                    "commit_date": data["commit_date"],
                    "author_name": data["author_name"],
                    "author_email": data["author_email"],
                    "additions": data["additions"],
                    "deletions": data["deletions"],
                    "files_changed": data["files_changed"],
                    "contributor": contributor,
                },
            )


def _fetch_pull_requests(repository, github_repo, limit: int = 100):
    """Fetch and store pull requests for a repository."""
    from .models import PullRequest

    prs_data = []

    try:
        # Fetch all PRs (open, closed, merged)
        pulls = github_repo.get_pulls(state="all", sort="updated", direction="desc")

        for i, pr in enumerate(pulls):
            if i >= limit:
                break

            # Determine state
            if pr.merged:
                state = PullRequest.PRState.MERGED
            elif pr.state == "closed":
                state = PullRequest.PRState.CLOSED
            else:
                state = PullRequest.PRState.OPEN

            # Get PR comments/discussion
            discussion = []
            try:
                for comment in pr.get_issue_comments()[:20]:  # Limit comments
                    discussion.append(
                        {
                            "author": comment.user.login if comment.user else "unknown",
                            "body": comment.body[:1000],  # Truncate long comments
                            "created_at": comment.created_at.isoformat(),
                        }
                    )
            except Exception:
                pass

            # Get commit SHAs
            commit_shas = []
            try:
                for commit in pr.get_commits()[:50]:  # Limit commits
                    commit_shas.append(commit.sha)
            except Exception:
                pass

            # Get labels
            labels = [label.name for label in pr.labels]

            pr_data = {
                "pr_number": pr.number,
                "title": pr.title,
                "description": pr.body or "",
                "author": pr.user.login if pr.user else "unknown",
                "author_avatar_url": pr.user.avatar_url if pr.user else None,
                "state": state,
                "created_at_github": pr.created_at,
                "updated_at_github": pr.updated_at,
                "merged_at": pr.merged_at,
                "closed_at": pr.closed_at,
                "additions": pr.additions,
                "deletions": pr.deletions,
                "changed_files": pr.changed_files,
                "commit_shas": commit_shas,
                "labels": labels,
                "discussion": discussion,
            }
            prs_data.append(pr_data)

    except GithubException as e:
        logger.warning(f"Could not fetch pull requests: {e}")
        return

    with transaction.atomic():
        for data in prs_data:
            PullRequest.objects.update_or_create(
                repository=repository,
                pr_number=data["pr_number"],
                defaults={
                    "title": data["title"],
                    "description": data["description"],
                    "author": data["author"],
                    "author_avatar_url": data["author_avatar_url"],
                    "state": data["state"],
                    "created_at_github": data["created_at_github"],
                    "updated_at_github": data["updated_at_github"],
                    "merged_at": data["merged_at"],
                    "closed_at": data["closed_at"],
                    "additions": data["additions"],
                    "deletions": data["deletions"],
                    "changed_files": data["changed_files"],
                    "commit_shas": data["commit_shas"],
                    "labels": data["labels"],
                    "discussion": data["discussion"],
                },
            )


def _fetch_issues(repository, github_repo, limit: int = 100):
    """Fetch and store issues for a repository."""
    from .models import Issue

    issues_data = []

    try:
        # Fetch all issues (excluding PRs)
        issues = github_repo.get_issues(state="all", sort="updated", direction="desc")

        for i, issue in enumerate(issues):
            if i >= limit:
                break

            # Skip pull requests (they appear as issues in GitHub API)
            if issue.pull_request is not None:
                continue

            # Determine state
            state = (
                Issue.IssueState.CLOSED
                if issue.state == "closed"
                else Issue.IssueState.OPEN
            )

            # Get issue comments/discussion
            discussion = []
            try:
                for comment in issue.get_comments()[:20]:  # Limit comments
                    discussion.append(
                        {
                            "author": comment.user.login if comment.user else "unknown",
                            "body": comment.body[:1000],  # Truncate long comments
                            "created_at": comment.created_at.isoformat(),
                        }
                    )
            except Exception:
                pass

            # Get labels
            labels = [label.name for label in issue.labels]

            issue_data = {
                "issue_number": issue.number,
                "title": issue.title,
                "description": issue.body or "",
                "author": issue.user.login if issue.user else "unknown",
                "author_avatar_url": issue.user.avatar_url if issue.user else None,
                "state": state,
                "created_at_github": issue.created_at,
                "updated_at_github": issue.updated_at,
                "closed_at": issue.closed_at,
                "labels": labels,
                "discussion": discussion,
            }
            issues_data.append(issue_data)

    except GithubException as e:
        logger.warning(f"Could not fetch issues: {e}")
        return

    with transaction.atomic():
        for data in issues_data:
            Issue.objects.update_or_create(
                repository=repository,
                issue_number=data["issue_number"],
                defaults={
                    "title": data["title"],
                    "description": data["description"],
                    "author": data["author"],
                    "author_avatar_url": data["author_avatar_url"],
                    "state": data["state"],
                    "created_at_github": data["created_at_github"],
                    "updated_at_github": data["updated_at_github"],
                    "closed_at": data["closed_at"],
                    "labels": data["labels"],
                    "discussion": data["discussion"],
                },
            )


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def analyze_repository_data(self, repository_id: str, group_type: str = "weekly"):
    """
    Analyze repository data by grouping commits into time periods.

    This task:
    1. Groups commits by week or month
    2. Creates CommitGroup records
    3. Links CommitData to CommitGroups
    4. Triggers AI summary generation
    """
    from .models import (
        Repository,
        CommitData,
        CommitGroup,
        PullRequest,
        Issue,
    )

    try:
        repository = Repository.objects.get(id=repository_id)
    except Repository.DoesNotExist:
        logger.error(f"Repository {repository_id} not found")
        return

    # Update status to analyzing
    repository.analysis_status = Repository.AnalysisStatus.ANALYZING
    repository.save()

    try:
        # Get all commits for this repository
        commits = CommitData.objects.filter(repository=repository).order_by(
            "commit_date"
        )

        if not commits.exists():
            logger.warning(f"No commits found for {repository.full_name}")
            repository.analysis_status = Repository.AnalysisStatus.COMPLETED
            repository.save()
            return

        # Determine date range
        earliest_commit = commits.first()
        latest_commit = commits.last()

        if not earliest_commit or not latest_commit:
            logger.warning(f"Could not determine date range for {repository.full_name}")
            return

        start_date = earliest_commit.commit_date.date()
        end_date = latest_commit.commit_date.date()

        # Create commit groups based on group_type
        if group_type == "weekly":
            groups = _create_weekly_groups(start_date, end_date)
        else:
            groups = _create_monthly_groups(start_date, end_date)

        # Delete existing commit groups for this repository to rebuild
        CommitGroup.objects.filter(repository=repository).delete()

        # Create CommitGroup records and link commits
        with transaction.atomic():
            for group_start, group_end in groups:
                # Get commits in this period
                group_commits = commits.filter(
                    commit_date__date__gte=group_start, commit_date__date__lte=group_end
                )

                if not group_commits.exists():
                    continue

                # Create the commit group
                commit_group = CommitGroup.objects.create(
                    repository=repository,
                    group_type=group_type,
                    start_date=group_start,
                    end_date=group_end,
                    commit_count=group_commits.count(),
                )

                # Link commits to this group
                group_commits.update(commit_group=commit_group)

                logger.info(
                    f"Created commit group {group_start} - {group_end} "
                    f"with {commit_group.commit_count} commits"
                )

        logger.info(f"Analysis complete for {repository.full_name}")

        # Trigger AI summary generation
        generate_ai_summaries.delay(repository_id)

    except Exception as e:
        logger.error(f"Error analyzing data for {repository.full_name}: {e}")
        repository.analysis_status = Repository.AnalysisStatus.FAILED
        repository.analysis_error = str(e)
        repository.save()
        raise


def _create_weekly_groups(start_date, end_date):
    """Create weekly date ranges from start to end."""
    groups = []

    # Start from the Monday of the week containing start_date
    current = start_date - timedelta(days=start_date.weekday())

    while current <= end_date:
        week_end = current + timedelta(days=6)
        groups.append((current, week_end))
        current = current + timedelta(days=7)

    return groups


def _create_monthly_groups(start_date, end_date):
    """Create monthly date ranges from start to end."""
    from calendar import monthrange

    groups = []

    # Start from the first day of the month containing start_date
    current = start_date.replace(day=1)

    while current <= end_date:
        # Get last day of the month
        _, last_day = monthrange(current.year, current.month)
        month_end = current.replace(day=last_day)
        groups.append((current, month_end))

        # Move to next month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    return groups


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def generate_ai_summaries(self, repository_id: str):
    """
    Generate AI summaries for commit groups and overall repository.

    This task:
    1. Generates summaries for each CommitGroup using Claude Haiku
    2. Calculates contributor impact scores
    3. Generates overall repository summary using Claude Sonnet
    4. Creates OverallSummary record
    """
    from .models import (
        Repository,
        CommitGroup,
        CommitData,
        Contributor,
        PullRequest,
        Issue,
        OverallSummary,
    )

    try:
        repository = Repository.objects.get(id=repository_id)
    except Repository.DoesNotExist:
        logger.error(f"Repository {repository_id} not found")
        return

    try:
        from apps.ai.client import AIClient

        ai_client = AIClient()
    except Exception as e:
        logger.error(f"Failed to initialize AI client: {e}")
        # Continue without AI - we'll still calculate impact scores
        ai_client = None

    try:
        # Get all commit groups for this repository
        commit_groups = CommitGroup.objects.filter(repository=repository).order_by(
            "start_date"
        )

        # Generate summary for each commit group
        group_summaries = []
        for commit_group in commit_groups:
            # Get commits in this group
            commits = CommitData.objects.filter(commit_group=commit_group)

            # Get PRs in this period
            prs = PullRequest.objects.filter(
                repository=repository,
                created_at_github__date__gte=commit_group.start_date,
                created_at_github__date__lte=commit_group.end_date,
            )

            # Get issues in this period
            issues = Issue.objects.filter(
                repository=repository,
                created_at_github__date__gte=commit_group.start_date,
                created_at_github__date__lte=commit_group.end_date,
            )

            # Prepare data for AI
            commits_data = [
                {
                    "sha": c.commit_sha,
                    "message": c.commit_message,
                    "author": c.author_name,
                }
                for c in commits
            ]

            prs_data = [
                {
                    "number": pr.pr_number,
                    "title": pr.title,
                    "state": pr.state,
                    "author": pr.author,
                }
                for pr in prs
            ]

            issues_data = [
                {
                    "number": issue.issue_number,
                    "title": issue.title,
                    "state": issue.state,
                }
                for issue in issues
            ]

            if ai_client:
                # Generate AI summary
                summary_result = ai_client.generate_commit_group_summary(
                    commits=commits_data,
                    pull_requests=prs_data,
                    issues=issues_data,
                    start_date=str(commit_group.start_date),
                    end_date=str(commit_group.end_date),
                )

                # Update commit group with AI-generated content
                commit_group.summary = summary_result.get("summary", "")
                commit_group.key_changes = summary_result.get("key_changes", [])
                commit_group.notable_features = summary_result.get(
                    "notable_features", []
                )
                commit_group.bug_fixes = summary_result.get("bug_fixes", [])
                commit_group.technical_decisions = summary_result.get(
                    "technical_decisions", []
                )
                commit_group.main_contributors = summary_result.get(
                    "main_contributors", []
                )
                commit_group.analyzed_at = datetime.now(timezone.utc)
                commit_group.save()

                group_summaries.append(
                    {
                        "period": f"{commit_group.start_date} to {commit_group.end_date}",
                        "summary": commit_group.summary,
                    }
                )

            logger.info(f"Generated summary for commit group {commit_group.start_date}")

        # Calculate contributor impact scores
        _calculate_contributor_scores(repository, ai_client)

        # Generate overall summary
        if ai_client and commit_groups.exists():
            _generate_overall_summary(repository, ai_client, group_summaries)

        # Update repository status
        repository.analysis_status = Repository.AnalysisStatus.COMPLETED
        repository.last_analyzed_at = datetime.now(timezone.utc)
        repository.save()

        logger.info(f"AI summaries complete for {repository.full_name}")

    except Exception as e:
        logger.error(f"Error generating AI summaries for {repository.full_name}: {e}")
        repository.analysis_status = Repository.AnalysisStatus.FAILED
        repository.analysis_error = f"AI summary error: {str(e)}"
        repository.save()
        raise


def _calculate_contributor_scores(repository, ai_client):
    """Calculate impact scores for all contributors."""
    from .models import Contributor, CommitData, PullRequest, Issue

    contributors = Contributor.objects.filter(repository=repository)

    for contributor in contributors:
        # Get commit stats
        commit_stats = CommitData.objects.filter(contributor=contributor).aggregate(
            total_commits=Count("id"),
            total_additions=Sum("additions"),
            total_deletions=Sum("deletions"),
        )

        # Get PR stats
        prs_opened = PullRequest.objects.filter(
            repository=repository, author=contributor.github_username
        ).count()

        prs_merged = PullRequest.objects.filter(
            repository=repository, author=contributor.github_username, state="merged"
        ).count()

        # Get issue stats (approximate - issues don't always have clear ownership)
        issues_opened = Issue.objects.filter(
            repository=repository, author=contributor.github_username
        ).count()

        issues_closed = Issue.objects.filter(
            repository=repository, author=contributor.github_username, state="closed"
        ).count()

        # Update contributor stats
        contributor.total_commits = commit_stats["total_commits"] or 0
        contributor.total_additions = commit_stats["total_additions"] or 0
        contributor.total_deletions = commit_stats["total_deletions"] or 0
        contributor.prs_opened = prs_opened
        contributor.prs_merged = prs_merged
        contributor.issues_opened = issues_opened
        contributor.issues_closed = issues_closed

        # Calculate impact score
        if ai_client:
            contributor.impact_score = ai_client.calculate_impact_score(
                commits=contributor.total_commits,
                additions=contributor.total_additions,
                deletions=contributor.total_deletions,
                prs_merged=prs_merged,
                prs_opened=prs_opened,
                issues_closed=issues_closed,
                issues_opened=issues_opened,
            )
        else:
            # Simple fallback scoring
            contributor.impact_score = (
                contributor.total_commits * 10 + prs_merged * 50 + prs_opened * 20
            )

        contributor.save()
        logger.info(
            f"Updated contributor {contributor.github_username}: "
            f"score={contributor.impact_score}"
        )


def _generate_overall_summary(repository, ai_client, group_summaries):
    """Generate and store overall repository summary."""
    from .models import Contributor, CommitData, PullRequest, Issue, OverallSummary

    # Get stats
    total_commits = CommitData.objects.filter(repository=repository).count()
    total_contributors = Contributor.objects.filter(repository=repository).count()
    total_prs = PullRequest.objects.filter(repository=repository).count()
    total_issues = Issue.objects.filter(repository=repository).count()

    # Get date range
    commits = CommitData.objects.filter(repository=repository).order_by("commit_date")
    if commits.exists():
        period_start = commits.first().commit_date.date()
        period_end = commits.last().commit_date.date()
    else:
        period_start = period_end = datetime.now(timezone.utc).date()

    # Get top contributors
    top_contributors = Contributor.objects.filter(repository=repository).order_by(
        "-impact_score"
    )[:10]

    contributors_data = [
        {
            "username": c.github_username,
            "commits": c.total_commits,
            "impact_score": c.impact_score,
        }
        for c in top_contributors
    ]

    # Generate overall summary
    summary_text = ai_client.generate_overall_summary(
        repo_name=repository.full_name,
        total_commits=total_commits,
        total_contributors=total_contributors,
        total_prs=total_prs,
        total_issues=total_issues,
        commit_group_summaries=group_summaries,
        top_contributors=contributors_data,
        period_start=str(period_start),
        period_end=str(period_end),
    )

    # Create or update overall summary
    OverallSummary.objects.update_or_create(
        repository=repository,
        defaults={
            "summary_text": summary_text,
            "total_commits": total_commits,
            "total_contributors": total_contributors,
            "total_prs": total_prs,
            "total_issues": total_issues,
            "analysis_period_start": period_start,
            "analysis_period_end": period_end,
            "generated_at": datetime.now(timezone.utc),
        },
    )

    logger.info(f"Generated overall summary for {repository.full_name}")
