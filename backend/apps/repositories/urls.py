from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepositoryViewSet, ExportViewSet

router = DefaultRouter()
router.register(r'', RepositoryViewSet, basename='repository')

export_router = DefaultRouter()
export_router.register(r'', ExportViewSet, basename='export')

urlpatterns = [
    path('', include(router.urls)),
]

export_urlpatterns = [
    path('', include(export_router.urls)),
]
