"""
Celery tasks for repository data fetching and processing.
"""
import logging
from datetime import datetime, timezone
from celery import shared_task
from django.db import transaction
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
        repository.description = github_repo.description or ''
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

        # Update status to completed (or trigger analysis task)
        repository.analysis_status = Repository.AnalysisStatus.COMPLETED
        repository.last_analyzed_at = datetime.now(timezone.utc)
        repository.save()

        logger.info(f"Successfully fetched data for {repository.full_name}")

        # TODO: Trigger analyze_repository_data task for AI summaries
        # analyze_repository_data.delay(repository_id)

    except GithubException as e:
        logger.error(f"GitHub API error for {repository.full_name}: {e}")
        repository.analysis_status = Repository.AnalysisStatus.FAILED
        repository.analysis_error = f"GitHub API error: {str(e)}"
        repository.save()

        # Retry on rate limit errors
        if e.status == 403 and 'rate limit' in str(e).lower():
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
            contributors_data.append({
                'github_username': contributor.login,
                'github_id': contributor.id,
                'avatar_url': contributor.avatar_url,
                'email': contributor.email,
                'total_commits': contributor.contributions,
            })
    except GithubException as e:
        logger.warning(f"Could not fetch contributors: {e}")
        return

    with transaction.atomic():
        for data in contributors_data:
            Contributor.objects.update_or_create(
                repository=repository,
                github_username=data['github_username'],
                defaults={
                    'github_id': data['github_id'],
                    'avatar_url': data['avatar_url'],
                    'email': data['email'],
                    'total_commits': data['total_commits'],
                }
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
                'commit_sha': commit.sha,
                'commit_message': commit.commit.message,
                'commit_date': commit.commit.author.date,
                'author_name': commit.commit.author.name,
                'author_email': commit.commit.author.email,
                'additions': commit.stats.additions if commit.stats else 0,
                'deletions': commit.stats.deletions if commit.stats else 0,
                'author_login': commit.author.login if commit.author else None,
            }

            # Get files changed (limit to avoid huge payloads)
            try:
                files_changed = []
                for f in commit.files[:20]:  # Limit to 20 files per commit
                    files_changed.append({
                        'filename': f.filename,
                        'additions': f.additions,
                        'deletions': f.deletions,
                        'status': f.status,
                    })
                commit_data['files_changed'] = files_changed
            except Exception:
                commit_data['files_changed'] = []

            commits_data.append(commit_data)

    except GithubException as e:
        logger.warning(f"Could not fetch commits: {e}")
        return

    with transaction.atomic():
        for data in commits_data:
            # Try to link to contributor
            contributor = None
            if data.get('author_login'):
                contributor = Contributor.objects.filter(
                    repository=repository,
                    github_username=data['author_login']
                ).first()

            CommitData.objects.update_or_create(
                repository=repository,
                commit_sha=data['commit_sha'],
                defaults={
                    'commit_message': data['commit_message'],
                    'commit_date': data['commit_date'],
                    'author_name': data['author_name'],
                    'author_email': data['author_email'],
                    'additions': data['additions'],
                    'deletions': data['deletions'],
                    'files_changed': data['files_changed'],
                    'contributor': contributor,
                }
            )


def _fetch_pull_requests(repository, github_repo, limit: int = 100):
    """Fetch and store pull requests for a repository."""
    from .models import PullRequest

    prs_data = []

    try:
        # Fetch all PRs (open, closed, merged)
        pulls = github_repo.get_pulls(state='all', sort='updated', direction='desc')

        for i, pr in enumerate(pulls):
            if i >= limit:
                break

            # Determine state
            if pr.merged:
                state = PullRequest.PRState.MERGED
            elif pr.state == 'closed':
                state = PullRequest.PRState.CLOSED
            else:
                state = PullRequest.PRState.OPEN

            # Get PR comments/discussion
            discussion = []
            try:
                for comment in pr.get_issue_comments()[:20]:  # Limit comments
                    discussion.append({
                        'author': comment.user.login if comment.user else 'unknown',
                        'body': comment.body[:1000],  # Truncate long comments
                        'created_at': comment.created_at.isoformat(),
                    })
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
                'pr_number': pr.number,
                'title': pr.title,
                'description': pr.body or '',
                'author': pr.user.login if pr.user else 'unknown',
                'author_avatar_url': pr.user.avatar_url if pr.user else None,
                'state': state,
                'created_at_github': pr.created_at,
                'updated_at_github': pr.updated_at,
                'merged_at': pr.merged_at,
                'closed_at': pr.closed_at,
                'additions': pr.additions,
                'deletions': pr.deletions,
                'changed_files': pr.changed_files,
                'commit_shas': commit_shas,
                'labels': labels,
                'discussion': discussion,
            }
            prs_data.append(pr_data)

    except GithubException as e:
        logger.warning(f"Could not fetch pull requests: {e}")
        return

    with transaction.atomic():
        for data in prs_data:
            PullRequest.objects.update_or_create(
                repository=repository,
                pr_number=data['pr_number'],
                defaults={
                    'title': data['title'],
                    'description': data['description'],
                    'author': data['author'],
                    'author_avatar_url': data['author_avatar_url'],
                    'state': data['state'],
                    'created_at_github': data['created_at_github'],
                    'updated_at_github': data['updated_at_github'],
                    'merged_at': data['merged_at'],
                    'closed_at': data['closed_at'],
                    'additions': data['additions'],
                    'deletions': data['deletions'],
                    'changed_files': data['changed_files'],
                    'commit_shas': data['commit_shas'],
                    'labels': data['labels'],
                    'discussion': data['discussion'],
                }
            )


def _fetch_issues(repository, github_repo, limit: int = 100):
    """Fetch and store issues for a repository."""
    from .models import Issue

    issues_data = []

    try:
        # Fetch all issues (excluding PRs)
        issues = github_repo.get_issues(state='all', sort='updated', direction='desc')

        for i, issue in enumerate(issues):
            if i >= limit:
                break

            # Skip pull requests (they appear as issues in GitHub API)
            if issue.pull_request is not None:
                continue

            # Determine state
            state = Issue.IssueState.CLOSED if issue.state == 'closed' else Issue.IssueState.OPEN

            # Get issue comments/discussion
            discussion = []
            try:
                for comment in issue.get_comments()[:20]:  # Limit comments
                    discussion.append({
                        'author': comment.user.login if comment.user else 'unknown',
                        'body': comment.body[:1000],  # Truncate long comments
                        'created_at': comment.created_at.isoformat(),
                    })
            except Exception:
                pass

            # Get labels
            labels = [label.name for label in issue.labels]

            issue_data = {
                'issue_number': issue.number,
                'title': issue.title,
                'description': issue.body or '',
                'author': issue.user.login if issue.user else 'unknown',
                'author_avatar_url': issue.user.avatar_url if issue.user else None,
                'state': state,
                'created_at_github': issue.created_at,
                'updated_at_github': issue.updated_at,
                'closed_at': issue.closed_at,
                'labels': labels,
                'discussion': discussion,
            }
            issues_data.append(issue_data)

    except GithubException as e:
        logger.warning(f"Could not fetch issues: {e}")
        return

    with transaction.atomic():
        for data in issues_data:
            Issue.objects.update_or_create(
                repository=repository,
                issue_number=data['issue_number'],
                defaults={
                    'title': data['title'],
                    'description': data['description'],
                    'author': data['author'],
                    'author_avatar_url': data['author_avatar_url'],
                    'state': data['state'],
                    'created_at_github': data['created_at_github'],
                    'updated_at_github': data['updated_at_github'],
                    'closed_at': data['closed_at'],
                    'labels': data['labels'],
                    'discussion': data['discussion'],
                }
            )
