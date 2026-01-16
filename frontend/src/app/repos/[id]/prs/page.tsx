"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { repositoriesApi } from "@/lib/repositories";
import type { PullRequest, PullRequestListItem } from "@/types";
import { GlassCard, AnimatedSection } from "@/components/ui";
import {
  GitPullRequest,
  GitMerge,
  XCircle,
  Clock,
  MessageSquare,
  FileCode,
  Plus,
  Minus,
  X,
  Loader2,
  Filter,
  ExternalLink,
} from "lucide-react";

type FilterState = "all" | "open" | "merged" | "closed";

export default function PullRequestsPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [pullRequests, setPullRequests] = useState<PullRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>("all");
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (repoId) {
      loadPullRequests();
    }
  }, [repoId]);

  const loadPullRequests = async () => {
    try {
      setLoading(true);
      const data = (await repositoriesApi.getPullRequests(
        repoId
      )) as PullRequestListItem[];
      setPullRequests(data);
    } catch (error) {
      console.error("Failed to load pull requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPRDetail = async (pr: PullRequestListItem) => {
    try {
      setLoadingDetail(true);
      const data = (await repositoriesApi.getPullRequests(repoId, {
        detail: true,
      })) as PullRequest[];
      const detail = data.find((p) => p.id === pr.id);
      if (detail) {
        setSelectedPR(detail);
      }
    } catch (error) {
      console.error("Failed to load PR detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredPRs = pullRequests.filter((pr) => {
    if (filter === "all") return true;
    return pr.state === filter;
  });

  const stats = {
    total: pullRequests.length,
    open: pullRequests.filter((pr) => pr.state === "open").length,
    merged: pullRequests.filter((pr) => pr.state === "merged").length,
    closed: pullRequests.filter((pr) => pr.state === "closed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <AnimatedSection animation="fade-up" delay={200}>
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <GitPullRequest className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Pull Requests
                </h2>
                <p className="text-gray-400">
                  {stats.total} total pull requests
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm">
                <GitPullRequest className="w-4 h-4" />
                {stats.open} open
              </span>
              <span className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm">
                <GitMerge className="w-4 h-4" />
                {stats.merged} merged
              </span>
              <span className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm">
                <XCircle className="w-4 h-4" />
                {stats.closed} closed
              </span>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Filter Tabs */}
      <AnimatedSection animation="fade-up" delay={300}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
            {(["all", "open", "merged", "closed"] as FilterState[]).map(
              (state) => (
                <button
                  key={state}
                  onClick={() => setFilter(state)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    filter === state
                      ? "bg-violet-500/20 text-violet-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {state}
                  <span className="ml-2 text-xs opacity-70">
                    {state === "all"
                      ? stats.total
                      : stats[state as keyof typeof stats]}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </AnimatedSection>

      {/* PR List */}
      {filteredPRs.length === 0 ? (
        <GlassCard className="text-center py-16">
          <GitPullRequest className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No pull requests found
          </h3>
          <p className="text-gray-400">
            {filter === "all"
              ? "No pull requests in this repository yet."
              : `No ${filter} pull requests found.`}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredPRs.map((pr, index) => (
            <AnimatedSection
              key={pr.id}
              animation="fade-up"
              delay={350 + index * 30}
            >
              <PRCard pr={pr} onClick={() => loadPRDetail(pr)} />
            </AnimatedSection>
          ))}
        </div>
      )}

      {/* PR Detail Modal */}
      {(selectedPR || loadingDetail) && (
        <PRDetailModal
          pr={selectedPR}
          loading={loadingDetail}
          onClose={() => setSelectedPR(null)}
        />
      )}
    </div>
  );
}

function PRCard({
  pr,
  onClick,
}: {
  pr: PullRequestListItem;
  onClick: () => void;
}) {
  const stateConfig = {
    open: {
      icon: GitPullRequest,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    merged: {
      icon: GitMerge,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    closed: {
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  };

  const config = stateConfig[pr.state];
  const Icon = config.icon;

  return (
    <GlassCard
      className="cursor-pointer hover:border-white/20 transition-colors"
      hover
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-medium mb-1 line-clamp-1">
                {pr.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>#{pr.pr_number}</span>
                <span>by {pr.author}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(pr.created_at_github)}
                </span>
              </div>
            </div>
          </div>

          {pr.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {pr.labels.slice(0, 4).map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
                >
                  {label}
                </span>
              ))}
              {pr.labels.length > 4 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{pr.labels.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {pr.author_avatar_url && (
          <img
            src={pr.author_avatar_url}
            alt={pr.author}
            className="w-8 h-8 rounded-full"
          />
        )}
      </div>
    </GlassCard>
  );
}

function PRDetailModal({
  pr,
  loading,
  onClose,
}: {
  pr: PullRequest | null;
  loading: boolean;
  onClose: () => void;
}) {
  const stateConfig = {
    open: {
      icon: GitPullRequest,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      label: "Open",
    },
    merged: {
      icon: GitMerge,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      label: "Merged",
    },
    closed: {
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      label: "Closed",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <GlassCard className="border border-white/10 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : pr ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-4 shrink-0">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${stateConfig[pr.state].bg}`}>
                    {(() => {
                      const Icon = stateConfig[pr.state].icon;
                      return (
                        <Icon
                          className={`w-5 h-5 ${stateConfig[pr.state].color}`}
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {pr.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <span>#{pr.pr_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          stateConfig[pr.state].bg
                        } ${stateConfig[pr.state].color}`}
                      >
                        {stateConfig[pr.state].label}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto space-y-4 -mx-6 px-6">
                {/* Author & Dates */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  {pr.author_avatar_url && (
                    <img
                      src={pr.author_avatar_url}
                      alt={pr.author}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">@{pr.author}</p>
                    <p className="text-sm text-gray-400">
                      opened on {formatDate(pr.created_at_github)}
                      {pr.merged_at &&
                        ` • merged on ${formatDate(pr.merged_at)}`}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                      <Plus className="w-4 h-4" />
                      <span className="font-semibold">{pr.additions}</span>
                    </div>
                    <p className="text-xs text-gray-400">additions</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                      <Minus className="w-4 h-4" />
                      <span className="font-semibold">{pr.deletions}</span>
                    </div>
                    <p className="text-xs text-gray-400">deletions</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                      <FileCode className="w-4 h-4" />
                      <span className="font-semibold">{pr.changed_files}</span>
                    </div>
                    <p className="text-xs text-gray-400">files changed</p>
                  </div>
                </div>

                {/* Description */}
                {pr.description && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {pr.description}
                    </p>
                  </div>
                )}

                {/* Labels */}
                {pr.labels.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {pr.labels.map((label) => (
                        <span
                          key={label}
                          className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discussion */}
                {pr.discussion.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Discussion ({pr.discussion.length} comments)
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {pr.discussion.map((comment, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white/5 rounded-lg border-l-2 border-violet-500/30"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-white">
                              @{comment.author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-3">
                            {comment.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/10 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
