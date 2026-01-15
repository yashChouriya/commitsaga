from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from github import Github, GithubException

from .serializers import (
    UserSerializer,
    SignupSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    GitHubPATValidationSerializer
)

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    Register a new user
    POST /api/auth/signup/
    Body: { "email": "user@example.com", "username": "username", "password": "password", "password2": "password" }
    """
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login user and return auth token
    POST /api/auth/login/
    Body: { "email": "user@example.com", "password": "password" }
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by deleting auth token
    POST /api/auth/logout/
    """
    try:
        request.user.auth_token.delete()
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile
    GET /api/auth/profile/
    PUT /api/auth/profile/
    PATCH /api/auth/profile/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Return response with UserSerializer
        return Response({
            'user': UserSerializer(instance).data,
            'message': 'Profile updated successfully'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_github_pat(request):
    """
    Validate GitHub Personal Access Token
    POST /api/auth/validate-pat/
    Body: { "token": "github_pat_xxx" }
    """
    serializer = GitHubPATValidationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']

    try:
        # Try to authenticate with GitHub
        g = Github(token)
        user = g.get_user()

        # If successful, get user info
        response_data = {
            'is_valid': True,
            'username': user.login,
            'message': f'Token is valid. Authenticated as {user.login}'
        }
        return Response(response_data, status=status.HTTP_200_OK)

    except GithubException as e:
        response_data = {
            'is_valid': False,
            'message': f'Invalid GitHub token: {str(e)}'
        }
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        response_data = {
            'is_valid': False,
            'message': f'Error validating token: {str(e)}'
        }
        return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_pat_status(request):
    """
    Check if user has configured GitHub PAT
    GET /api/auth/check-pat/
    """
    user = request.user
    return Response({
        'has_token': user.has_github_token,
        'github_username': user.github_username,
        'message': 'GitHub PAT configured' if user.has_github_token else 'GitHub PAT not configured'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_github_repos(request):
    """
    List user's GitHub repositories
    GET /api/auth/github-repos/
    Query params:
        - page: page number (default: 1)
        - per_page: items per page (default: 30, max: 100)
        - type: 'all', 'owner', 'public', 'private', 'member' (default: 'all')
        - sort: 'created', 'updated', 'pushed', 'full_name' (default: 'updated')
    """
    user = request.user
    github_token = user.get_github_token()

    if not github_token:
        return Response({
            'error': 'GitHub token not configured. Please add your GitHub PAT in settings.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get query params
    page = int(request.query_params.get('page', 1))
    per_page = min(int(request.query_params.get('per_page', 30)), 100)
    repo_type = request.query_params.get('type', 'all')
    sort = request.query_params.get('sort', 'updated')

    try:
        g = Github(github_token)
        github_user = g.get_user()

        # Get repositories
        repos = github_user.get_repos(type=repo_type, sort=sort)

        # Calculate pagination
        total_count = repos.totalCount
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        # Fetch repos for current page
        repos_list = []
        for i, repo in enumerate(repos):
            if i < start_idx:
                continue
            if i >= end_idx:
                break

            repos_list.append({
                'id': repo.id,
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'html_url': repo.html_url,
                'clone_url': repo.clone_url,
                'default_branch': repo.default_branch,
                'private': repo.private,
                'fork': repo.fork,
                'stars_count': repo.stargazers_count,
                'forks_count': repo.forks_count,
                'language': repo.language,
                'updated_at': repo.updated_at.isoformat() if repo.updated_at else None,
                'pushed_at': repo.pushed_at.isoformat() if repo.pushed_at else None,
            })

        return Response({
            'repositories': repos_list,
            'total_count': total_count,
            'page': page,
            'per_page': per_page,
            'has_next': end_idx < total_count,
            'has_previous': page > 1,
        }, status=status.HTTP_200_OK)

    except GithubException as e:
        return Response({
            'error': f'GitHub API error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Error fetching repositories: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
