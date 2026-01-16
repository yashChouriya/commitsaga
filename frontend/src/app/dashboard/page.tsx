"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  AlertCircle,
  CheckCircle,
  Plus,
  Sparkles,
  FolderGit2,
  ArrowRight,
  Star,
  GitFork,
  Users,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  X,
  Clock,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { authApi, type GitHubRepo } from "@/lib/auth";
import { repositoriesApi } from "@/lib/repositories";
import type { RepositoryListItem, AnalysisStatus } from "@/types";
import {
  MeshBackground,
  Navbar,
  GlassCard,
  GlassInput,
  Button,
  AnimatedSection,
} from "@/components/ui";

const MAX_REPOSITORIES = 1;

const statusConfig: Record<
  AnalysisStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-400",
    icon: <Clock className="w-4 h-4" />,
  },
  fetching: {
    label: "Fetching...",
    color: "text-blue-400",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  analyzing: {
    label: "Analyzing...",
    color: "text-purple-400",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [patStatus, setPATStatus] = useState<{
    has_token: boolean;
    github_username: string | null;
  } | null>(null);
  const [loadingPAT, setLoadingPAT] = useState(true);
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  // GitHub repos modal state
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingGithubRepos, setLoadingGithubRepos] = useState(false);
  const [githubReposError, setGithubReposError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [addingRepo, setAddingRepo] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const REPOS_PER_PAGE = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadPATStatus();
      loadRepositories();
    }
  }, [user]);

  const loadPATStatus = async () => {
    try {
      const status = await authApi.checkPATStatus();
      setPATStatus(status);
    } catch (error) {
      console.error("Failed to load PAT status:", error);
    } finally {
      setLoadingPAT(false);
    }
  };

  const loadRepositories = useCallback(async () => {
    try {
      setLoadingRepos(true);
      const repos = await repositoriesApi.list();
      setRepositories(repos);
    } catch (error) {
      console.error("Failed to load repositories:", error);
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const loadGithubRepos = useCallback(async (page: number = 1) => {
    setLoadingGithubRepos(true);
    setGithubReposError(null);

    try {
      const response = await authApi.getGitHubRepos({
        page,
        per_page: REPOS_PER_PAGE,
        sort: "updated",
      });
      setGithubRepos(response.repositories);
      setTotalCount(response.total_count);
      setHasNextPage(response.has_next);
      setHasPrevPage(response.has_previous);
      setCurrentPage(page);
    } catch (error: any) {
      console.error("Failed to load GitHub repos:", error);
      setGithubReposError(
        error.response?.data?.error || "Failed to load repositories"
      );
    } finally {
      setLoadingGithubRepos(false);
    }
  }, []);

  const handleOpenModal = () => {
    setShowAddModal(true);
    setSelectedRepo(null);
    setAddError(null);
    setSearchQuery("");
    loadGithubRepos(1);
  };

  const handleCloseModal = () => {
    if (!addingRepo) {
      setShowAddModal(false);
      setSelectedRepo(null);
      setAddError(null);
      setGithubRepos([]);
    }
  };

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setAddError(null);
  };

  const handleAddSelectedRepo = async () => {
    if (!selectedRepo) return;

    setAddingRepo(true);
    setAddError(null);

    try {
      await repositoriesApi.create({
        github_repo_url: selectedRepo.html_url,
      });
      setShowAddModal(false);
      setSelectedRepo(null);
      await loadRepositories();
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.github_repo_url?.[0] ||
        "Failed to add repository. Please try again.";
      setAddError(message);
    } finally {
      setAddingRepo(false);
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this repository? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await repositoriesApi.delete(id);
      await loadRepositories();
    } catch (error) {
      console.error("Failed to delete repository:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReanalyze = async (id: string) => {
    setReanalyzingId(id);
    try {
      await repositoriesApi.reanalyze(id);
      await loadRepositories();
    } catch (error: any) {
      console.error("Failed to reanalyze:", error);
      alert(error.response?.data?.error || "Failed to start re-analysis");
    } finally {
      setReanalyzingId(null);
    }
  };

  // Poll for status updates when there are pending/fetching/analyzing repos
  useEffect(() => {
    const hasActiveAnalysis = repositories.some(
      (r) =>
        r.analysis_status === "pending" ||
        r.analysis_status === "fetching" ||
        r.analysis_status === "analyzing"
    );

    if (hasActiveAnalysis) {
      const interval = setInterval(loadRepositories, 5000);
      return () => clearInterval(interval);
    }
  }, [repositories, loadRepositories]);

  // Filter repos by search query
  const filteredRepos = githubRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCommits = repositories?.reduce(
    (acc, r) => acc + r.commits_count,
    0
  );
  const totalContributors = repositories?.reduce(
    (acc, r) => acc + r.contributors_count,
    0
  );
  const hasRepository = repositories.length >= MAX_REPOSITORIES;

  return (
    <div className="min-h-screen">
      <MeshBackground />
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-8xl">
          {/* Welcome Section */}
          <AnimatedSection animation="fade-up" delay={0}>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                Welcome back,{" "}
                <span className="gradient-text-static">{user.username}</span>!
              </h1>
              <p className="text-gray-400">
                Manage your repository and view insights
              </p>
            </div>
          </AnimatedSection>

          {/* GitHub PAT Status Card */}
          {!loadingPAT && (
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="mb-8">
                {patStatus?.has_token ? (
                  <GlassCard className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="h-14 w-14 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-white">
                        GitHub Connected
                      </h3>
                      <p className="text-gray-400">
                        Your GitHub account is connected as{" "}
                        <span className="text-violet-400 font-medium">
                          @{patStatus.github_username}
                        </span>
                      </p>
                    </div>
                    <Link href="/settings">
                      <Button variant="secondary" size="sm">
                        Update Token
                      </Button>
                    </Link>
                  </GlassCard>
                ) : (
                  <GlassCard className="border-amber-500/30 bg-amber-500/5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      <div className="h-14 w-14 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1 text-white">
                          GitHub Token Required
                        </h3>
                        <p className="text-gray-400">
                          To analyze repositories, you need to connect your
                          GitHub account with a Personal Access Token.
                        </p>
                      </div>
                      <Link href="/settings">
                        <Button variant="primary" iconPosition="left">
                          Configure Token
                        </Button>
                      </Link>
                    </div>
                  </GlassCard>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* Quick Stats */}
          <AnimatedSection animation="fade-up" delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Repository",
                  value: repositories.length.toString(),
                  icon: FolderGit2,
                },
                {
                  label: "Total Commits",
                  value: totalCommits.toString(),
                  icon: GitBranch,
                },
                {
                  label: "Contributors",
                  value: totalContributors.toString(),
                  icon: Users,
                },
                {
                  label: "AI Summaries",
                  value: repositories
                    .filter((r) => r.analysis_status === "completed")
                    .length.toString(),
                  icon: Sparkles,
                },
              ].map((stat) => (
                <GlassCard key={stat.label} className="text-center py-6">
                  <stat.icon className="w-6 h-6 text-violet-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </AnimatedSection>

          {/* Repository Section */}
          <AnimatedSection animation="fade-up" delay={300}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Your Repository
              </h2>
              {patStatus?.has_token && !hasRepository && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={handleOpenModal}
                >
                  Import Repository
                </Button>
              )}
            </div>

            {loadingRepos ? (
              <GlassCard className="py-16">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                  <p className="text-gray-400">Loading repository...</p>
                </div>
              </GlassCard>
            ) : repositories.length === 0 ? (
              <GlassCard className="py-16">
                <div className="text-center max-w-md mx-auto">
                  <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
                    <FolderGit2 className="h-10 w-10 text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">
                    No repository yet
                  </h3>
                  <p className="text-gray-400 mb-8">
                    {patStatus?.has_token
                      ? "Import a repository from your GitHub account to start analyzing commit history and generating AI-powered insights."
                      : "Configure your GitHub token first, then import a repository to start analyzing."}
                  </p>
                  {patStatus?.has_token && (
                    <Button
                      variant="primary"
                      size="lg"
                      icon={<Plus className="h-5 w-5" />}
                      iconPosition="left"
                      onClick={handleOpenModal}
                    >
                      Import Repository
                    </Button>
                  )}
                </div>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {repositories.map((repo) => (
                  <RepositoryCard
                    key={repo.id}
                    repository={repo}
                    onDelete={() => handleDeleteRepository(repo.id)}
                    onReanalyze={() => handleReanalyze(repo.id)}
                    isDeleting={deletingId === repo.id}
                    isReanalyzing={reanalyzingId === repo.id}
                  />
                ))}
              </div>
            )}
          </AnimatedSection>

          {/* Getting Started Tips */}
          {!patStatus?.has_token && (
            <AnimatedSection animation="fade-up" delay={400}>
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Getting Started
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      step: "1",
                      title: "Connect GitHub",
                      description:
                        "Add your Personal Access Token to authenticate with GitHub.",
                      action: "/settings",
                      actionLabel: "Go to Settings",
                    },
                    {
                      step: "2",
                      title: "Import Repository",
                      description:
                        "Select a repository from your GitHub account to analyze.",
                      action: null,
                      actionLabel: "After connecting GitHub",
                    },
                    {
                      step: "3",
                      title: "View Insights",
                      description:
                        "Explore AI-generated summaries and contributor statistics.",
                      action: null,
                      actionLabel: "After analysis",
                    },
                  ].map((item) => (
                    <GlassCard
                      key={item.step}
                      hover={!!item.action}
                      className="relative overflow-hidden"
                    >
                      <div className="absolute top-4 right-4 text-5xl font-bold text-white/5">
                        {item.step}
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-lg font-semibold mb-2 text-white">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {item.description}
                        </p>
                        {item.action ? (
                          <Link href={item.action}>
                            <span className="text-violet-400 hover:text-violet-300 text-sm font-medium inline-flex items-center gap-1 transition-colors">
                              {item.actionLabel}
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </Link>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {item.actionLabel}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </main>

      {/* Import Repository Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col">
            <GlassCard className="border border-white/10 flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-xl font-semibold text-white">
                  Import Repository
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                  disabled={addingRepo}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4 shrink-0">
                <GlassInput
                  icon={<Search className="w-5 h-5" />}
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loadingGithubRepos}
                />
              </div>

              {/* Repository List */}
              <div className="flex-1 overflow-y-auto min-h-[300px] -mx-6 px-6">
                {loadingGithubRepos ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
                    <p className="text-gray-400 text-sm">
                      Loading your repositories...
                    </p>
                  </div>
                ) : githubReposError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                    <p className="text-red-400 text-sm">{githubReposError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => loadGithubRepos(currentPage)}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FolderGit2 className="w-8 h-8 text-gray-500 mb-3" />
                    <p className="text-gray-400 text-sm">
                      {searchQuery
                        ? "No repositories match your search"
                        : "No repositories found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleSelectRepo(repo)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedRepo?.id === repo.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-1">
                            {repo.private ? (
                              <Lock className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <FolderGit2 className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white truncate">
                                {repo.name}
                              </span>
                              {repo.fork && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                                  Fork
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-gray-400 truncate mb-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {repo.language && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stars_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitFork className="w-3 h-3" />
                                {repo.forks_count}
                              </span>
                            </div>
                          </div>
                          {selectedRepo?.id === repo.id && (
                            <CheckCircle className="w-5 h-5 text-violet-400 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!loadingGithubRepos &&
                !githubReposError &&
                totalCount > REPOS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 shrink-0">
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of{" "}
                      {Math.ceil(totalCount / REPOS_PER_PAGE)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadGithubRepos(currentPage - 1)}
                        disabled={!hasPrevPage || loadingGithubRepos}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => loadGithubRepos(currentPage + 1)}
                        disabled={!hasNextPage || loadingGithubRepos}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              {/* Error message */}
              {addError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 shrink-0">
                  <p className="text-sm text-red-400">{addError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/10 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  disabled={addingRepo}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddSelectedRepo}
                  loading={addingRepo}
                  disabled={!selectedRepo || addingRepo}
                  className="flex-1"
                >
                  {selectedRepo
                    ? `Import ${selectedRepo.name}`
                    : "Select a repository"}
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}

function RepositoryCard({
  repository,
  onDelete,
  onReanalyze,
  isDeleting,
  isReanalyzing,
}: {
  repository: RepositoryListItem;
  onDelete: () => void;
  onReanalyze: () => void;
  isDeleting: boolean;
  isReanalyzing: boolean;
}) {
  const status = statusConfig[repository.analysis_status];
  const isAnalyzing =
    repository.analysis_status === "fetching" ||
    repository.analysis_status === "analyzing";
  const isCompleted = repository.analysis_status === "completed";

  return (
    <GlassCard hover className="group">
      <div className="flex flex-col gap-4">
        {/* Repository Info */}
        <div className="flex-1 min-w-0">
          <div className="md:flex md:justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-violet-400 shrink-0" />
              <h3 className="text-lg font-semibold text-white truncate">
                {repository.full_name}
              </h3>
              <a
                href={repository.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-violet-400 transition-colors shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 ${status.color}`}>
                {status.icon}
                <span className="text-sm font-medium">{status.label}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReanalyze();
                  }}
                  disabled={isReanalyzing || isAnalyzing}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Re-analyze"
                >
                  {isReanalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={isDeleting}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {repository.description && (
            <p className="text-gray-400 text-sm mb-2">
              {repository.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              {repository.branch}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {repository.stars_count}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              {repository.forks_count}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {repository.contributors_count}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              {repository.commits_count} commits
            </span>
          </div>
        </div>

        {/* View Details Button */}
        {isCompleted && (
          <Link
            href={`/repos/${repository.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-500/20 to-purple-600/20 hover:from-violet-500/30 hover:to-purple-600/30 border border-violet-500/30 rounded-xl text-violet-400 hover:text-violet-300 font-medium transition-all"
          >
            <Sparkles className="w-4 h-4" />
            View Analysis & Insights
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
