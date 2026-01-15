"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { repositoriesApi } from "@/lib/repositories";
import type { Issue, IssueListItem } from "@/types";
import { GlassCard, AnimatedSection } from "@/components/ui";
import {
  CircleDot,
  CheckCircle,
  Clock,
  MessageSquare,
  Tag,
  X,
  Loader2,
  AlertTriangle,
  Lightbulb,
  GitPullRequest,
} from "lucide-react";

type FilterState = "all" | "open" | "closed";

export default function IssuesPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (repoId) {
      loadIssues();
    }
  }, [repoId]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = (await repositoriesApi.getIssues(repoId)) as IssueListItem[];
      setIssues(data);
    } catch (error) {
      console.error("Failed to load issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadIssueDetail = async (issue: IssueListItem) => {
    try {
      setLoadingDetail(true);
      const data = (await repositoriesApi.getIssues(repoId, {
        detail: true,
      })) as Issue[];
      const detail = data.find((i) => i.id === issue.id);
      if (detail) {
        setSelectedIssue(detail);
      }
    } catch (error) {
      console.error("Failed to load issue detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filter === "all") return true;
    return issue.state === filter;
  });

  const stats = {
    total: issues.length,
    open: issues.filter((issue) => issue.state === "open").length,
    closed: issues.filter((issue) => issue.state === "closed").length,
  };

  // Categorize issues by labels
  const categorizedIssues = {
    bugs: filteredIssues.filter((issue) =>
      issue.labels.some((l) => l.toLowerCase().includes("bug"))
    ),
    features: filteredIssues.filter((issue) =>
      issue.labels.some(
        (l) =>
          l.toLowerCase().includes("feature") ||
          l.toLowerCase().includes("enhancement")
      )
    ),
    others: filteredIssues.filter(
      (issue) =>
        !issue.labels.some(
          (l) =>
            l.toLowerCase().includes("bug") ||
            l.toLowerCase().includes("feature") ||
            l.toLowerCase().includes("enhancement")
        )
    ),
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
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <CircleDot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Issues</h2>
                <p className="text-gray-400">{stats.total} total issues tracked</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm">
                <CircleDot className="w-4 h-4" />
                {stats.open} open
              </span>
              <span className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 text-violet-400 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" />
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
            {(["all", "open", "closed"] as FilterState[]).map((state) => (
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
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <GlassCard className="text-center py-16">
          <CircleDot className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No issues found
          </h3>
          <p className="text-gray-400">
            {filter === "all"
              ? "No issues in this repository yet."
              : `No ${filter} issues found.`}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Bugs Section */}
          {categorizedIssues.bugs.length > 0 && (
            <IssueSection
              title="Bugs"
              icon={AlertTriangle}
              iconColor="text-red-400"
              iconBg="bg-red-500/10"
              issues={categorizedIssues.bugs}
              onSelect={loadIssueDetail}
              delay={350}
            />
          )}

          {/* Features Section */}
          {categorizedIssues.features.length > 0 && (
            <IssueSection
              title="Features & Enhancements"
              icon={Lightbulb}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10"
              issues={categorizedIssues.features}
              onSelect={loadIssueDetail}
              delay={400}
            />
          )}

          {/* Other Issues */}
          {categorizedIssues.others.length > 0 && (
            <IssueSection
              title="Other Issues"
              icon={CircleDot}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              issues={categorizedIssues.others}
              onSelect={loadIssueDetail}
              delay={450}
            />
          )}
        </div>
      )}

      {/* Issue Detail Modal */}
      {(selectedIssue || loadingDetail) && (
        <IssueDetailModal
          issue={selectedIssue}
          loading={loadingDetail}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}

function IssueSection({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  issues,
  onSelect,
  delay,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  issues: IssueListItem[];
  onSelect: (issue: IssueListItem) => void;
  delay: number;
}) {
  return (
    <AnimatedSection animation="fade-up" delay={delay}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-sm text-gray-500">({issues.length})</span>
        </div>

        <div className="space-y-2">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={() => onSelect(issue)} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function IssueCard({
  issue,
  onClick,
}: {
  issue: IssueListItem;
  onClick: () => void;
}) {
  const isOpen = issue.state === "open";

  return (
    <GlassCard
      className="cursor-pointer hover:border-white/20 transition-colors"
      hover
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-2 rounded-lg ${isOpen ? "bg-green-500/10" : "bg-violet-500/10"}`}
        >
          {isOpen ? (
            <CircleDot className="w-5 h-5 text-green-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-violet-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-medium mb-1 line-clamp-1">
                {issue.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>#{issue.issue_number}</span>
                <span>by {issue.author}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(issue.created_at_github)}
                </span>
                {issue.closed_at && (
                  <span className="text-violet-400">
                    closed {formatDate(issue.closed_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {issue.labels.slice(0, 4).map((label) => (
                <span
                  key={label}
                  className={`px-2 py-1 rounded text-xs ${getLabelStyle(label)}`}
                >
                  {label}
                </span>
              ))}
              {issue.labels.length > 4 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{issue.labels.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {issue.author_avatar_url && (
          <img
            src={issue.author_avatar_url}
            alt={issue.author}
            className="w-8 h-8 rounded-full"
          />
        )}
      </div>
    </GlassCard>
  );
}

function IssueDetailModal({
  issue,
  loading,
  onClose,
}: {
  issue: Issue | null;
  loading: boolean;
  onClose: () => void;
}) {
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
          ) : issue ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-4 shrink-0">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${issue.state === "open" ? "bg-green-500/10" : "bg-violet-500/10"}`}
                  >
                    {issue.state === "open" ? (
                      <CircleDot className="w-5 h-5 text-green-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-violet-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {issue.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <span>#{issue.issue_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${issue.state === "open" ? "bg-green-500/10 text-green-400" : "bg-violet-500/10 text-violet-400"}`}
                      >
                        {issue.state}
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
                  {issue.author_avatar_url && (
                    <img
                      src={issue.author_avatar_url}
                      alt={issue.author}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">@{issue.author}</p>
                    <p className="text-sm text-gray-400">
                      opened on {formatDate(issue.created_at_github)}
                      {issue.closed_at &&
                        ` • closed on ${formatDate(issue.closed_at)}`}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {issue.description && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {issue.description}
                    </p>
                  </div>
                )}

                {/* AI Analysis (if available) */}
                {(issue.problem_description || issue.solution_description) && (
                  <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-xl border border-violet-500/20">
                    <h4 className="text-sm font-medium text-violet-400 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      AI Analysis
                    </h4>
                    {issue.problem_description && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Problem</p>
                        <p className="text-sm text-gray-300">
                          {issue.problem_description}
                        </p>
                      </div>
                    )}
                    {issue.solution_description && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Solution</p>
                        <p className="text-sm text-gray-300">
                          {issue.solution_description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Resolution PR */}
                {issue.resolution_pr_number && (
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <GitPullRequest className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Resolved by PR #{issue.resolution_pr_number}
                      </span>
                    </div>
                  </div>
                )}

                {/* Labels */}
                {issue.labels.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {issue.labels.map((label) => (
                        <span
                          key={label}
                          className={`px-3 py-1 rounded-full text-sm ${getLabelStyle(label)}`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discussion */}
                {issue.discussion.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Discussion ({issue.discussion.length} comments)
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {issue.discussion.map((comment, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white/5 rounded-lg border-l-2 border-amber-500/30"
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

function getLabelStyle(label: string): string {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("bug")) return "bg-red-500/20 text-red-400";
  if (lowerLabel.includes("feature") || lowerLabel.includes("enhancement"))
    return "bg-emerald-500/20 text-emerald-400";
  if (lowerLabel.includes("documentation") || lowerLabel.includes("docs"))
    return "bg-blue-500/20 text-blue-400";
  if (lowerLabel.includes("help") || lowerLabel.includes("question"))
    return "bg-purple-500/20 text-purple-400";
  if (lowerLabel.includes("good first"))
    return "bg-green-500/20 text-green-400";
  return "bg-white/10 text-gray-300";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
