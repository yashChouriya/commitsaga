from rest_framework import serializers
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
import re

# Maximum repositories per user
MAX_REPOSITORIES_PER_USER = 2


class ContributorSerializer(serializers.ModelSerializer):
    """Serializer for Contributor model"""

    class Meta:
        model = Contributor
        fields = [
            'id',
            'github_username',
            'github_id',
            'avatar_url',
            'email',
            'total_commits',
            'total_additions',
            'total_deletions',
            'prs_opened',
            'prs_merged',
            'issues_opened',
            'issues_closed',
            'impact_score',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommitDataSerializer(serializers.ModelSerializer):
    """Serializer for CommitData model"""

    contributor_username = serializers.CharField(
        source='contributor.github_username',
        read_only=True
    )

    class Meta:
        model = CommitData
        fields = [
            'id',
            'commit_sha',
            'commit_message',
            'commit_date',
            'author_name',
            'author_email',
            'files_changed',
            'additions',
            'deletions',
            'contributor_username',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CommitGroupSerializer(serializers.ModelSerializer):
    """Serializer for CommitGroup model"""

    commits = CommitDataSerializer(many=True, read_only=True)

    class Meta:
        model = CommitGroup
        fields = [
            'id',
            'group_type',
            'start_date',
            'end_date',
            'commit_count',
            'summary',
            'key_changes',
            'notable_features',
            'bug_fixes',
            'technical_decisions',
            'main_contributors',
            'analyzed_at',
            'commits',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommitGroupListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing commit groups without commits"""

    class Meta:
        model = CommitGroup
        fields = [
            'id',
            'group_type',
            'start_date',
            'end_date',
            'commit_count',
            'summary',
            'analyzed_at',
            'created_at',
        ]


class PullRequestSerializer(serializers.ModelSerializer):
    """Serializer for PullRequest model"""

    class Meta:
        model = PullRequest
        fields = [
            'id',
            'pr_number',
            'title',
            'description',
            'author',
            'author_avatar_url',
            'state',
            'created_at_github',
            'updated_at_github',
            'merged_at',
            'closed_at',
            'additions',
            'deletions',
            'changed_files',
            'commit_shas',
            'labels',
            'discussion',
            'ai_summary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PullRequestListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing PRs"""

    class Meta:
        model = PullRequest
        fields = [
            'id',
            'pr_number',
            'title',
            'author',
            'author_avatar_url',
            'state',
            'created_at_github',
            'merged_at',
            'labels',
        ]


class IssueSerializer(serializers.ModelSerializer):
    """Serializer for Issue model"""

    resolution_pr_number = serializers.IntegerField(
        source='resolution_pr.pr_number',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Issue
        fields = [
            'id',
            'issue_number',
            'title',
            'description',
            'author',
            'author_avatar_url',
            'state',
            'created_at_github',
            'updated_at_github',
            'closed_at',
            'labels',
            'discussion',
            'ai_summary',
            'problem_description',
            'solution_description',
            'resolution_pr_number',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IssueListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing issues"""

    class Meta:
        model = Issue
        fields = [
            'id',
            'issue_number',
            'title',
            'author',
            'author_avatar_url',
            'state',
            'created_at_github',
            'closed_at',
            'labels',
        ]


class OverallSummarySerializer(serializers.ModelSerializer):
    """Serializer for OverallSummary model"""

    class Meta:
        model = OverallSummary
        fields = [
            'id',
            'summary_text',
            'total_commits',
            'total_contributors',
            'total_prs',
            'total_issues',
            'analysis_period_start',
            'analysis_period_end',
            'generated_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ExportSerializer(serializers.ModelSerializer):
    """Serializer for Export model"""

    class Meta:
        model = Export
        fields = [
            'id',
            'export_type',
            'date_range_start',
            'date_range_end',
            'file_path',
            'file_size',
            'created_at',
        ]
        read_only_fields = ['id', 'file_path', 'file_size', 'created_at']


class RepositorySerializer(serializers.ModelSerializer):
    """Full serializer for Repository model"""

    contributors_count = serializers.SerializerMethodField()
    commits_count = serializers.SerializerMethodField()
    prs_count = serializers.SerializerMethodField()
    issues_count = serializers.SerializerMethodField()
    branch = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Repository
        fields = [
            'id',
            'github_repo_url',
            'repo_name',
            'owner',
            'description',
            'default_branch',
            'selected_branch',
            'branch',
            'full_name',
            'analysis_status',
            'last_analyzed_at',
            'analysis_error',
            'cron_enabled',
            'cron_frequency',
            'stars_count',
            'forks_count',
            'open_issues_count',
            'contributors_count',
            'commits_count',
            'prs_count',
            'issues_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'repo_name',
            'owner',
            'description',
            'default_branch',
            'analysis_status',
            'last_analyzed_at',
            'analysis_error',
            'stars_count',
            'forks_count',
            'open_issues_count',
            'created_at',
            'updated_at',
        ]

    def get_contributors_count(self, obj):
        return obj.contributors.count()

    def get_commits_count(self, obj):
        return obj.commits.count()

    def get_prs_count(self, obj):
        return obj.pull_requests.count()

    def get_issues_count(self, obj):
        return obj.issues.count()


class RepositoryListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing repositories"""

    branch = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    contributors_count = serializers.SerializerMethodField()
    commits_count = serializers.SerializerMethodField()

    class Meta:
        model = Repository
        fields = [
            'id',
            'github_repo_url',
            'repo_name',
            'owner',
            'full_name',
            'description',
            'branch',
            'analysis_status',
            'last_analyzed_at',
            'stars_count',
            'forks_count',
            'contributors_count',
            'commits_count',
            'cron_enabled',
            'created_at',
        ]

    def get_contributors_count(self, obj):
        return obj.contributors.count()

    def get_commits_count(self, obj):
        return obj.commits.count()


class RepositoryCreateSerializer(serializers.Serializer):
    """Serializer for creating a new repository"""

    github_repo_url = serializers.URLField(required=True)
    selected_branch = serializers.CharField(required=False, allow_blank=True)

    def validate_github_repo_url(self, value):
        """Validate and parse GitHub repository URL"""
        # Patterns to match GitHub URLs
        patterns = [
            r'https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$',
            r'git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$',
        ]

        for pattern in patterns:
            match = re.match(pattern, value)
            if match:
                owner, repo_name = match.groups()
                # Clean up repo name (remove .git if present)
                repo_name = repo_name.replace('.git', '')
                self.context['owner'] = owner
                self.context['repo_name'] = repo_name
                return value

        raise serializers.ValidationError(
            "Invalid GitHub repository URL. Please use format: https://github.com/owner/repo"
        )

    def validate(self, attrs):
        """Check repository limit and duplicates"""
        user = self.context['request'].user

        # Check repository limit
        current_repo_count = Repository.objects.filter(user=user).count()
        if current_repo_count >= MAX_REPOSITORIES_PER_USER:
            raise serializers.ValidationError({
                'github_repo_url': f'You have reached the maximum limit of {MAX_REPOSITORIES_PER_USER} repositories.'
            })

        # Check for duplicate repository
        github_repo_url = attrs.get('github_repo_url')
        if Repository.objects.filter(user=user, github_repo_url=github_repo_url).exists():
            raise serializers.ValidationError({
                'github_repo_url': 'You have already added this repository.'
            })

        return attrs


class RepositoryUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating repository settings"""

    class Meta:
        model = Repository
        fields = ['selected_branch', 'cron_enabled', 'cron_frequency']

    def validate(self, attrs):
        """Validate cron settings"""
        cron_enabled = attrs.get('cron_enabled', self.instance.cron_enabled)
        cron_frequency = attrs.get('cron_frequency', self.instance.cron_frequency)

        if cron_enabled and not cron_frequency:
            raise serializers.ValidationError({
                'cron_frequency': 'Cron frequency is required when cron is enabled.'
            })

        return attrs
