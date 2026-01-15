import uuid
from django.db import models
from django.conf import settings


class Repository(models.Model):
    """Repository model for storing GitHub repository information"""

    class AnalysisStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        FETCHING = 'fetching', 'Fetching Data'
        ANALYZING = 'analyzing', 'Analyzing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    class CronFrequency(models.TextChoices):
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='repositories'
    )
    github_repo_url = models.URLField(max_length=500)
    repo_name = models.CharField(max_length=255)
    owner = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    default_branch = models.CharField(max_length=100, default='main')
    selected_branch = models.CharField(max_length=100, blank=True, null=True)

    # Analysis status
    analysis_status = models.CharField(
        max_length=20,
        choices=AnalysisStatus.choices,
        default=AnalysisStatus.PENDING
    )
    last_analyzed_at = models.DateTimeField(blank=True, null=True)
    analysis_error = models.TextField(blank=True, null=True)

    # Cron settings
    cron_enabled = models.BooleanField(default=False)
    cron_frequency = models.CharField(
        max_length=20,
        choices=CronFrequency.choices,
        blank=True,
        null=True
    )

    # Metadata
    stars_count = models.IntegerField(default=0)
    forks_count = models.IntegerField(default=0)
    open_issues_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'repositories'
        verbose_name = 'Repository'
        verbose_name_plural = 'Repositories'
        unique_together = ['user', 'github_repo_url']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.owner}/{self.repo_name}"

    @property
    def branch(self):
        """Return selected branch or default branch"""
        return self.selected_branch or self.default_branch

    @property
    def full_name(self):
        return f"{self.owner}/{self.repo_name}"


class Contributor(models.Model):
    """Contributor model for storing repository contributor information"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='contributors'
    )
    github_username = models.CharField(max_length=255)
    github_id = models.BigIntegerField(blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    # Stats
    total_commits = models.IntegerField(default=0)
    total_additions = models.IntegerField(default=0)
    total_deletions = models.IntegerField(default=0)
    prs_opened = models.IntegerField(default=0)
    prs_merged = models.IntegerField(default=0)
    issues_opened = models.IntegerField(default=0)
    issues_closed = models.IntegerField(default=0)

    # Gamification
    impact_score = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contributors'
        verbose_name = 'Contributor'
        verbose_name_plural = 'Contributors'
        unique_together = ['repository', 'github_username']
        ordering = ['-impact_score']

    def __str__(self):
        return f"{self.github_username} ({self.repository.full_name})"


class CommitGroup(models.Model):
    """CommitGroup model for grouping commits by time period"""

    class GroupType(models.TextChoices):
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='commit_groups'
    )
    group_type = models.CharField(
        max_length=20,
        choices=GroupType.choices,
        default=GroupType.WEEKLY
    )
    start_date = models.DateField()
    end_date = models.DateField()
    commit_count = models.IntegerField(default=0)

    # AI-generated content
    summary = models.TextField(blank=True, null=True)
    key_changes = models.JSONField(default=list, blank=True)
    notable_features = models.JSONField(default=list, blank=True)
    bug_fixes = models.JSONField(default=list, blank=True)
    technical_decisions = models.JSONField(default=list, blank=True)
    main_contributors = models.JSONField(default=list, blank=True)

    analyzed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'commit_groups'
        verbose_name = 'Commit Group'
        verbose_name_plural = 'Commit Groups'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.repository.full_name} ({self.start_date} - {self.end_date})"


class CommitData(models.Model):
    """CommitData model for storing individual commit information"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commit_group = models.ForeignKey(
        CommitGroup,
        on_delete=models.CASCADE,
        related_name='commits',
        blank=True,
        null=True
    )
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='commits'
    )
    contributor = models.ForeignKey(
        Contributor,
        on_delete=models.SET_NULL,
        related_name='commits',
        blank=True,
        null=True
    )

    commit_sha = models.CharField(max_length=40)
    commit_message = models.TextField()
    commit_date = models.DateTimeField()
    author_name = models.CharField(max_length=255)
    author_email = models.EmailField(blank=True, null=True)

    # Stats
    files_changed = models.JSONField(default=list, blank=True)
    additions = models.IntegerField(default=0)
    deletions = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'commit_data'
        verbose_name = 'Commit'
        verbose_name_plural = 'Commits'
        unique_together = ['repository', 'commit_sha']
        ordering = ['-commit_date']

    def __str__(self):
        return f"{self.commit_sha[:7]} - {self.commit_message[:50]}"


class PullRequest(models.Model):
    """PullRequest model for storing PR information"""

    class PRState(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'
        MERGED = 'merged', 'Merged'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='pull_requests'
    )

    pr_number = models.IntegerField()
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    author = models.CharField(max_length=255)
    author_avatar_url = models.URLField(max_length=500, blank=True, null=True)

    state = models.CharField(
        max_length=20,
        choices=PRState.choices,
        default=PRState.OPEN
    )

    # Dates
    created_at_github = models.DateTimeField()
    updated_at_github = models.DateTimeField(blank=True, null=True)
    merged_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)

    # Stats
    additions = models.IntegerField(default=0)
    deletions = models.IntegerField(default=0)
    changed_files = models.IntegerField(default=0)

    # Related data
    commit_shas = models.JSONField(default=list, blank=True)
    labels = models.JSONField(default=list, blank=True)
    discussion = models.JSONField(default=list, blank=True)  # Comments

    # AI-generated summary
    ai_summary = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pull_requests'
        verbose_name = 'Pull Request'
        verbose_name_plural = 'Pull Requests'
        unique_together = ['repository', 'pr_number']
        ordering = ['-created_at_github']

    def __str__(self):
        return f"#{self.pr_number} - {self.title}"


class Issue(models.Model):
    """Issue model for storing GitHub issue information"""

    class IssueState(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='issues'
    )
    resolution_pr = models.ForeignKey(
        PullRequest,
        on_delete=models.SET_NULL,
        related_name='resolved_issues',
        blank=True,
        null=True
    )

    issue_number = models.IntegerField()
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    author = models.CharField(max_length=255)
    author_avatar_url = models.URLField(max_length=500, blank=True, null=True)

    state = models.CharField(
        max_length=20,
        choices=IssueState.choices,
        default=IssueState.OPEN
    )

    # Dates
    created_at_github = models.DateTimeField()
    updated_at_github = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)

    # Labels and discussion
    labels = models.JSONField(default=list, blank=True)
    discussion = models.JSONField(default=list, blank=True)  # Comments

    # AI-generated content
    ai_summary = models.TextField(blank=True, null=True)
    problem_description = models.TextField(blank=True, null=True)
    solution_description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'issues'
        verbose_name = 'Issue'
        verbose_name_plural = 'Issues'
        unique_together = ['repository', 'issue_number']
        ordering = ['-created_at_github']

    def __str__(self):
        return f"#{self.issue_number} - {self.title}"


class OverallSummary(models.Model):
    """OverallSummary model for storing repository-level AI summaries"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='overall_summaries'
    )

    summary_text = models.TextField()

    # Stats at time of generation
    total_commits = models.IntegerField(default=0)
    total_contributors = models.IntegerField(default=0)
    total_prs = models.IntegerField(default=0)
    total_issues = models.IntegerField(default=0)

    # Period covered
    analysis_period_start = models.DateField(blank=True, null=True)
    analysis_period_end = models.DateField(blank=True, null=True)

    generated_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'overall_summaries'
        verbose_name = 'Overall Summary'
        verbose_name_plural = 'Overall Summaries'
        ordering = ['-generated_at']

    def __str__(self):
        return f"Summary for {self.repository.full_name} ({self.generated_at.date()})"


class Export(models.Model):
    """Export model for storing markdown export information"""

    class ExportType(models.TextChoices):
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        COMPLETE = 'complete', 'Complete'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='exports'
    )

    export_type = models.CharField(
        max_length=20,
        choices=ExportType.choices
    )

    # Date range for weekly/monthly exports
    date_range_start = models.DateField(blank=True, null=True)
    date_range_end = models.DateField(blank=True, null=True)

    # File info
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)  # In bytes

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exports'
        verbose_name = 'Export'
        verbose_name_plural = 'Exports'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.export_type} export for {self.repository.full_name}"
