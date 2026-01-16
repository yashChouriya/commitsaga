from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from github import Github, GithubException

from django.http import FileResponse, Http404
import os

from .models import (
    Repository,
    Contributor,
    CommitGroup,
    PullRequest,
    Issue,
    Export,
)
from .serializers import (
    RepositorySerializer,
    RepositoryListSerializer,
    RepositoryCreateSerializer,
    RepositoryUpdateSerializer,
    ContributorSerializer,
    CommitGroupSerializer,
    CommitGroupListSerializer,
    PullRequestSerializer,
    PullRequestListSerializer,
    IssueSerializer,
    IssueListSerializer,
    OverallSummarySerializer,
    ExportSerializer,
    CreateExportSerializer,
)


class RepositoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Repository CRUD operations

    list: GET /api/repositories/
    create: POST /api/repositories/
    retrieve: GET /api/repositories/{id}/
    update: PUT /api/repositories/{id}/
    partial_update: PATCH /api/repositories/{id}/
    destroy: DELETE /api/repositories/{id}/
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return repositories for the current user"""
        return Repository.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return RepositoryCreateSerializer
        elif self.action == 'list':
            return RepositoryListSerializer
        elif self.action in ['update', 'partial_update']:
            return RepositoryUpdateSerializer
        return RepositorySerializer

    def create(self, request, *args, **kwargs):
        """
        Add a new repository

        POST /api/repositories/
        Body: { "github_repo_url": "https://github.com/owner/repo", "selected_branch": "main" }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        github_repo_url = serializer.validated_data['github_repo_url']
        selected_branch = serializer.validated_data.get('selected_branch')
        owner = serializer.context['owner']
        repo_name = serializer.context['repo_name']

        # Validate repository exists on GitHub
        github_token = request.user.get_github_token()
        if not github_token:
            return Response(
                {'error': 'GitHub token not configured. Please add your GitHub PAT in settings.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            g = Github(github_token)
            github_repo = g.get_repo(f"{owner}/{repo_name}")

            # Get repository info
            default_branch = github_repo.default_branch
            description = github_repo.description or ''
            stars_count = github_repo.stargazers_count
            forks_count = github_repo.forks_count
            open_issues_count = github_repo.open_issues_count

            # Validate selected branch if provided
            if selected_branch:
                try:
                    github_repo.get_branch(selected_branch)
                except GithubException:
                    return Response(
                        {'error': f"Branch '{selected_branch}' not found in repository."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        except GithubException as e:
            if e.status == 404:
                return Response(
                    {'error': 'Repository not found. Please check the URL and ensure you have access.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(
                {'error': f'GitHub API error: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create repository record
        repository = Repository.objects.create(
            user=request.user,
            github_repo_url=github_repo_url,
            repo_name=repo_name,
            owner=owner,
            description=description,
            default_branch=default_branch,
            selected_branch=selected_branch or None,
            stars_count=stars_count,
            forks_count=forks_count,
            open_issues_count=open_issues_count,
            analysis_status=Repository.AnalysisStatus.PENDING,
        )

        # Trigger Celery task for fetching repository data
        from .tasks import fetch_repository_data
        fetch_repository_data.delay(repository.id)

        return Response(
            {
                'repository': RepositorySerializer(repository).data,
                'message': 'Repository added successfully. Data fetching has started.'
            },
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a repository and all related data"""
        instance = self.get_object()
        repo_name = instance.full_name
        self.perform_destroy(instance)
        return Response(
            {'message': f'Repository {repo_name} deleted successfully.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def reanalyze(self, request, pk=None):
        """
        Trigger re-analysis of a repository

        POST /api/repositories/{id}/reanalyze/
        """
        repository = self.get_object()

        if repository.analysis_status in [
            Repository.AnalysisStatus.FETCHING,
            Repository.AnalysisStatus.ANALYZING
        ]:
            return Response(
                {'error': 'Analysis is already in progress.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset status and trigger analysis
        repository.analysis_status = Repository.AnalysisStatus.PENDING
        repository.analysis_error = None
        repository.save()

        from .tasks import fetch_repository_data
        fetch_repository_data.delay(repository.id)

        return Response({
            'message': 'Re-analysis started.',
            'repository': RepositorySerializer(repository).data
        })

    @action(detail=True, methods=['get'])
    def contributors(self, request, pk=None):
        """
        Get contributors for a repository

        GET /api/repositories/{id}/contributors/
        """
        repository = self.get_object()
        contributors = repository.contributors.all()
        serializer = ContributorSerializer(contributors, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def commit_groups(self, request, pk=None):
        """
        Get commit groups for a repository

        GET /api/repositories/{id}/commit_groups/
        """
        repository = self.get_object()
        commit_groups = repository.commit_groups.all()

        # Use lighter serializer for list view
        detail = request.query_params.get('detail', 'false').lower() == 'true'
        if detail:
            serializer = CommitGroupSerializer(commit_groups, many=True)
        else:
            serializer = CommitGroupListSerializer(commit_groups, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def pull_requests(self, request, pk=None):
        """
        Get pull requests for a repository

        GET /api/repositories/{id}/pull_requests/
        """
        repository = self.get_object()
        pull_requests = repository.pull_requests.all()

        # Filter by state if provided
        state = request.query_params.get('state')
        if state:
            pull_requests = pull_requests.filter(state=state)

        # Use lighter serializer for list view
        detail = request.query_params.get('detail', 'false').lower() == 'true'
        if detail:
            serializer = PullRequestSerializer(pull_requests, many=True)
        else:
            serializer = PullRequestListSerializer(pull_requests, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def issues(self, request, pk=None):
        """
        Get issues for a repository

        GET /api/repositories/{id}/issues/
        """
        repository = self.get_object()
        issues = repository.issues.all()

        # Filter by state if provided
        state = request.query_params.get('state')
        if state:
            issues = issues.filter(state=state)

        # Use lighter serializer for list view
        detail = request.query_params.get('detail', 'false').lower() == 'true'
        if detail:
            serializer = IssueSerializer(issues, many=True)
        else:
            serializer = IssueListSerializer(issues, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """
        Get the latest overall summary for a repository

        GET /api/repositories/{id}/summary/
        """
        repository = self.get_object()
        summary = repository.overall_summaries.first()

        if not summary:
            return Response(
                {'message': 'No summary available yet.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OverallSummarySerializer(summary)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def branches(self, request, pk=None):
        """
        Get available branches for a repository

        GET /api/repositories/{id}/branches/
        """
        repository = self.get_object()

        github_token = request.user.get_github_token()
        if not github_token:
            return Response(
                {'error': 'GitHub token not configured.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            g = Github(github_token)
            github_repo = g.get_repo(repository.full_name)
            branches = [branch.name for branch in github_repo.get_branches()]

            return Response({
                'branches': branches,
                'default_branch': repository.default_branch,
                'selected_branch': repository.selected_branch,
            })

        except GithubException as e:
            return Response(
                {'error': f'Failed to fetch branches: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Get statistics for a repository

        GET /api/repositories/{id}/stats/
        """
        repository = self.get_object()

        return Response({
            'repository': repository.full_name,
            'analysis_status': repository.analysis_status,
            'last_analyzed_at': repository.last_analyzed_at,
            'stats': {
                'total_commits': repository.commits.count(),
                'total_contributors': repository.contributors.count(),
                'total_prs': repository.pull_requests.count(),
                'total_issues': repository.issues.count(),
                'open_prs': repository.pull_requests.filter(state='open').count(),
                'merged_prs': repository.pull_requests.filter(state='merged').count(),
                'open_issues': repository.issues.filter(state='open').count(),
                'closed_issues': repository.issues.filter(state='closed').count(),
            },
            'github_stats': {
                'stars': repository.stars_count,
                'forks': repository.forks_count,
                'open_issues': repository.open_issues_count,
            }
        })

    @action(detail=True, methods=['get'])
    def exports(self, request, pk=None):
        """
        Get all exports for a repository

        GET /api/repositories/{id}/exports/
        """
        repository = self.get_object()
        exports = repository.exports.all()
        serializer = ExportSerializer(exports, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='export')
    def create_export(self, request, pk=None):
        """
        Create a new export for a repository

        POST /api/repositories/{id}/export/
        Body: { "export_type": "complete" } or
              { "export_type": "weekly", "date_range_start": "2024-01-01", "date_range_end": "2024-01-07" }
        """
        repository = self.get_object()

        # Validate repository has been analyzed
        if repository.analysis_status != Repository.AnalysisStatus.COMPLETED:
            return Response(
                {'error': 'Repository analysis must be completed before exporting.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreateExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        export_type = serializer.validated_data['export_type']
        date_range_start = serializer.validated_data.get('date_range_start')
        date_range_end = serializer.validated_data.get('date_range_end')

        # Trigger Celery task for generating markdown export
        from .tasks import generate_markdown_export
        task = generate_markdown_export.delay(
            str(repository.id),
            export_type,
            str(date_range_start) if date_range_start else None,
            str(date_range_end) if date_range_end else None,
        )

        return Response({
            'message': 'Export generation started.',
            'task_id': task.id,
        }, status=status.HTTP_202_ACCEPTED)


class ExportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Export operations

    list: GET /api/exports/
    retrieve: GET /api/exports/{id}/
    download: GET /api/exports/{id}/download/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ExportSerializer

    def get_queryset(self):
        """Return exports for repositories owned by the current user"""
        return Export.objects.filter(repository__user=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download an export file

        GET /api/exports/{id}/download/
        """
        export = self.get_object()

        if not export.file_path or not os.path.exists(export.file_path):
            raise Http404("Export file not found.")

        # Get filename for download
        filename = os.path.basename(export.file_path)

        response = FileResponse(
            open(export.file_path, 'rb'),
            content_type='text/markdown',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
