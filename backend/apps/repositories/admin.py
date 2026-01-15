from django.contrib import admin
from .models import (
    Repository,
    Contributor,
    CommitGroup,
    CommitData,
    PullRequest,
    Issue,
    OverallSummary,
    Export,
)


@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'analysis_status', 'stars_count', 'last_analyzed_at', 'created_at']
    list_filter = ['analysis_status', 'cron_enabled', 'created_at']
    search_fields = ['repo_name', 'owner', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(Contributor)
class ContributorAdmin(admin.ModelAdmin):
    list_display = ['github_username', 'repository', 'total_commits', 'impact_score', 'created_at']
    list_filter = ['repository', 'created_at']
    search_fields = ['github_username', 'repository__repo_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-impact_score']


@admin.register(CommitGroup)
class CommitGroupAdmin(admin.ModelAdmin):
    list_display = ['repository', 'group_type', 'start_date', 'end_date', 'commit_count', 'analyzed_at']
    list_filter = ['group_type', 'repository', 'analyzed_at']
    search_fields = ['repository__repo_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-start_date']


@admin.register(CommitData)
class CommitDataAdmin(admin.ModelAdmin):
    list_display = ['short_sha', 'short_message', 'repository', 'author_name', 'commit_date', 'additions', 'deletions']
    list_filter = ['repository', 'commit_date']
    search_fields = ['commit_sha', 'commit_message', 'author_name']
    readonly_fields = ['id', 'created_at']
    ordering = ['-commit_date']

    def short_sha(self, obj):
        return obj.commit_sha[:7]
    short_sha.short_description = 'SHA'

    def short_message(self, obj):
        return obj.commit_message[:50] + '...' if len(obj.commit_message) > 50 else obj.commit_message
    short_message.short_description = 'Message'


@admin.register(PullRequest)
class PullRequestAdmin(admin.ModelAdmin):
    list_display = ['pr_number', 'title', 'repository', 'author', 'state', 'created_at_github', 'merged_at']
    list_filter = ['state', 'repository', 'created_at_github']
    search_fields = ['title', 'author', 'repository__repo_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at_github']


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ['issue_number', 'title', 'repository', 'author', 'state', 'created_at_github', 'closed_at']
    list_filter = ['state', 'repository', 'created_at_github']
    search_fields = ['title', 'author', 'repository__repo_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at_github']


@admin.register(OverallSummary)
class OverallSummaryAdmin(admin.ModelAdmin):
    list_display = ['repository', 'total_commits', 'total_contributors', 'generated_at']
    list_filter = ['repository', 'generated_at']
    search_fields = ['repository__repo_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-generated_at']


@admin.register(Export)
class ExportAdmin(admin.ModelAdmin):
    list_display = ['repository', 'export_type', 'date_range_start', 'date_range_end', 'file_size', 'created_at']
    list_filter = ['export_type', 'repository', 'created_at']
    search_fields = ['repository__repo_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
