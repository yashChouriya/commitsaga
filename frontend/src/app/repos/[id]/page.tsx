"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { repositoriesApi } from "@/lib/repositories";
import type {
  RepositoryStats,
  OverallSummary,
  Contributor,
  CommitGroupListItem,
} from "@/types";
import { GlassCard, AnimatedSection, Markdown } from "@/components/ui";
import {
  GitCommit,
  Users,
  GitPullRequest,
  CircleDot,
  Sparkles,
  TrendingUp,
  Calendar,
  ArrowRight,
  Trophy,
  Medal,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  GitMerge,
} from "lucide-react";

export default function RepositoryOverviewPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [summary, setSummary] = useState<OverallSummary | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [commitGroups, setCommitGroups] = useState<CommitGroupListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (repoId) {
      loadData();
    }
  }, [repoId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, summaryData, contributorsData, groupsData] =
        await Promise.all([
          repositoriesApi.getStats(repoId),
          repositoriesApi.getSummary(repoId).catch(() => null),
          repositoriesApi.getContributors(repoId),
          repositoriesApi.getCommitGroups(repoId) as Promise<
            CommitGroupListItem[]
          >,
        ]);

      setStats(statsData);
      setSummary(summaryData);
      setContributors(contributorsData);
      setCommitGroups(groupsData);
    } catch (error) {
      console.error("Failed to load repository data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  const topContributors = contributors.slice(0, 5);
  const recentGroups = commitGroups.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <AnimatedSection animation="fade-up" delay={200}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={GitCommit}
            label="Commits"
            value={stats?.stats.total_commits || 0}
            color="violet"
          />
          <StatCard
            icon={Users}
            label="Contributors"
            value={stats?.stats.total_contributors || 0}
            color="blue"
          />
          <StatCard
            icon={GitPullRequest}
            label="Pull Requests"
            value={stats?.stats.total_prs || 0}
            subValue={`${stats?.stats.merged_prs || 0} merged`}
            color="emerald"
          />
          <StatCard
            icon={CircleDot}
            label="Issues"
            value={stats?.stats.total_issues || 0}
            subValue={`${stats?.stats.open_issues || 0} open`}
            color="amber"
          />
        </div>
      </AnimatedSection>

      {/* AI Summary Section */}
      <AnimatedSection animation="fade-up" delay={300}>
        <GlassCard>
          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                AI-Generated Summary
              </h2>
              <p className="text-sm text-gray-400">
                {summary?.analysis_period_start && summary?.analysis_period_end
                  ? `Analysis period: ${formatDate(
                      summary.analysis_period_start
                    )} - ${formatDate(summary.analysis_period_end)}`
                  : "Powered by Claude AI"}
              </p>
            </div>
          </div>

          {summary ? (
            <div className="prose prose-invert max-w-none">
              <Markdown content={summary.summary_text} />
            </div>
          ) : (
            <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
              <AlertCircle className="w-5 h-5" />
              <span>
                No summary available yet. The analysis may still be in progress.
              </span>
            </div>
          )}
        </GlassCard>
      </AnimatedSection>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <AnimatedSection animation="fade-up" delay={400}>
          <GlassCard className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Top Contributors
                </h2>
              </div>
              <Link
                href={`/repos/${repoId}/contributors`}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {topContributors.length > 0 ? (
              <div className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <ContributorRow
                    key={contributor.id}
                    contributor={contributor}
                    rank={index + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No contributors found
              </div>
            )}
          </GlassCard>
        </AnimatedSection>

        {/* Recent Activity */}
        <AnimatedSection animation="fade-up" delay={500}>
          <GlassCard className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Recent Activity
                </h2>
              </div>
              <Link
                href={`/repos/${repoId}/timeline`}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1"
              >
                View timeline <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentGroups.length > 0 ? (
              <div className="space-y-4">
                {recentGroups.map((group) => (
                  <CommitGroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No activity data available
              </div>
            )}
          </GlassCard>
        </AnimatedSection>
      </div>

      {/* PR & Issues Quick Stats */}
      <AnimatedSection animation="fade-up" delay={600}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* PR Summary */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <GitPullRequest className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Pull Requests
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <GitPullRequest className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats?.stats.open_prs || 0}
                </p>
                <p className="text-xs text-gray-400">Open</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <GitMerge className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats?.stats.merged_prs || 0}
                </p>
                <p className="text-xs text-gray-400">Merged</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {(stats?.stats.total_prs || 0) -
                    (stats?.stats.open_prs || 0) -
                    (stats?.stats.merged_prs || 0)}
                </p>
                <p className="text-xs text-gray-400">Closed</p>
              </div>
            </div>
            <Link
              href={`/repos/${repoId}/prs`}
              className="mt-4 block text-center text-violet-400 hover:text-violet-300 text-sm font-medium"
            >
              View all pull requests
            </Link>
          </GlassCard>

          {/* Issues Summary */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <CircleDot className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Issues</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CircleDot className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats?.stats.open_issues || 0}
                </p>
                <p className="text-xs text-gray-400">Open</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats?.stats.closed_issues || 0}
                </p>
                <p className="text-xs text-gray-400">Closed</p>
              </div>
            </div>
            <Link
              href={`/repos/${repoId}/issues`}
              className="mt-4 block text-center text-violet-400 hover:text-violet-300 text-sm font-medium"
            >
              View all issues
            </Link>
          </GlassCard>
        </div>
      </AnimatedSection>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subValue?: string;
  color: "violet" | "blue" | "emerald" | "amber";
}) {
  const colorClasses = {
    violet: "from-violet-500 to-purple-600 text-violet-400",
    blue: "from-blue-500 to-cyan-600 text-blue-400",
    emerald: "from-emerald-500 to-green-600 text-emerald-400",
    amber: "from-amber-500 to-orange-600 text-amber-400",
  };

  return (
    <GlassCard className="text-center py-6">
      <div
        className={`h-12 w-12 rounded-xl bg-linear-to-br ${colorClasses[color]
          .split(" ")
          .slice(0, 2)
          .join(" ")} flex items-center justify-center mx-auto mb-3`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-bold text-white mb-1">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-gray-400">{label}</p>
      {subValue && (
        <p className={`text-xs mt-1 ${colorClasses[color].split(" ")[2]}`}>
          {subValue}
        </p>
      )}
    </GlassCard>
  );
}

function ContributorRow({
  contributor,
  rank,
}: {
  contributor: Contributor;
  rank: number;
}) {
  const rankIcons = {
    1: <Trophy className="w-4 h-4 text-yellow-400" />,
    2: <Medal className="w-4 h-4 text-gray-300" />,
    3: <Award className="w-4 h-4 text-amber-600" />,
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
      <div className="w-8 h-8 flex items-center justify-center">
        {rankIcons[rank as keyof typeof rankIcons] || (
          <span className="text-gray-500 font-medium">{rank}</span>
        )}
      </div>
      <div className="relative">
        {contributor.avatar_url ? (
          <img
            src={contributor.avatar_url}
            alt={contributor.github_username}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {contributor.github_username[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">
          {contributor.github_username}
        </p>
        <p className="text-xs text-gray-400">
          {contributor.total_commits} commits
        </p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-violet-400">
          <TrendingUp className="w-4 h-4" />
          <span className="font-semibold">{contributor.impact_score}</span>
        </div>
        <p className="text-xs text-gray-500">impact</p>
      </div>
    </div>
  );
}

function CommitGroupCard({ group }: { group: CommitGroupListItem }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-violet-400">
          {formatDate(group.start_date)} - {formatDate(group.end_date)}
        </span>
        <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">
          {group.commit_count} commits
        </span>
      </div>
      {group.summary ? (
        <p className="text-sm text-gray-300 line-clamp-2">{group.summary}</p>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Summary pending analysis...
        </p>
      )}
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
