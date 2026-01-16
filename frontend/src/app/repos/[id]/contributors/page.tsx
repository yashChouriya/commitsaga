"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { repositoriesApi } from "@/lib/repositories";
import type { Contributor } from "@/types";
import { GlassCard, AnimatedSection } from "@/components/ui";
import {
  Users,
  Trophy,
  Medal,
  Award,
  GitCommit,
  GitPullRequest,
  GitMerge,
  CircleDot,
  TrendingUp,
  Plus,
  Minus,
  Loader2,
  Crown,
} from "lucide-react";

export default function ContributorsPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContributor, setSelectedContributor] =
    useState<Contributor | null>(null);

  useEffect(() => {
    if (repoId) {
      loadContributors();
    }
  }, [repoId]);

  const loadContributors = async () => {
    try {
      setLoading(true);
      const data = await repositoriesApi.getContributors(repoId);
      setContributors(data);
    } catch (error) {
      console.error("Failed to load contributors:", error);
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

  const topThree = contributors.slice(0, 3);
  const others = contributors.slice(3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedSection animation="fade-up" delay={200}>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Contributor Leaderboard
              </h2>
              <p className="text-gray-400">
                {contributors.length} contributors ranked by impact score
              </p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {contributors.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No contributors yet
          </h3>
          <p className="text-gray-400">
            Contributors will appear here once the repository analysis is
            complete.
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Podium - Top 3 */}
          <AnimatedSection animation="fade-up" delay={300}>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Second Place */}
              <div className="order-2 md:order-1">
                {topThree[1] && (
                  <PodiumCard
                    contributor={topThree[1]}
                    rank={2}
                    onClick={() => setSelectedContributor(topThree[1])}
                  />
                )}
              </div>

              {/* First Place */}
              <div className="order-1 md:order-2">
                {topThree[0] && (
                  <PodiumCard
                    contributor={topThree[0]}
                    rank={1}
                    onClick={() => setSelectedContributor(topThree[0])}
                  />
                )}
              </div>

              {/* Third Place */}
              <div className="order-3 md:mt-12">
                {topThree[2] && (
                  <PodiumCard
                    contributor={topThree[2]}
                    rank={3}
                    onClick={() => setSelectedContributor(topThree[2])}
                  />
                )}
              </div>
            </div>
          </AnimatedSection>

          {/* Rest of the leaderboard */}
          {others.length > 0 && (
            <AnimatedSection animation="fade-up" delay={400}>
              <GlassCard>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Other Contributors
                </h3>
                <div className="space-y-2">
                  {others.map((contributor, index) => (
                    <LeaderboardRow
                      key={contributor.id}
                      contributor={contributor}
                      rank={index + 4}
                      onClick={() => setSelectedContributor(contributor)}
                    />
                  ))}
                </div>
              </GlassCard>
            </AnimatedSection>
          )}
        </>
      )}

      {/* Contributor Detail Modal */}
      {selectedContributor && (
        <ContributorModal
          contributor={selectedContributor}
          rank={
            contributors.findIndex((c) => c.id === selectedContributor.id) + 1
          }
          onClose={() => setSelectedContributor(null)}
        />
      )}
    </div>
  );
}

function PodiumCard({
  contributor,
  rank,
  onClick,
}: {
  contributor: Contributor;
  rank: number;
  onClick: () => void;
}) {
  const rankConfig = {
    1: {
      gradient: "from-yellow-500 to-amber-600",
      icon: Crown,
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/5",
      iconColor: "text-yellow-400",
    },
    2: {
      gradient: "from-gray-300 to-gray-400",
      icon: Medal,
      border: "border-gray-400/30",
      bg: "bg-gray-400/5",
      iconColor: "text-gray-300",
    },
    3: {
      gradient: "from-amber-600 to-amber-700",
      icon: Award,
      border: "border-amber-600/30",
      bg: "bg-amber-600/5",
      iconColor: "text-amber-500",
    },
  };

  const config = rankConfig[rank as keyof typeof rankConfig];
  const Icon = config.icon;

  return (
    <GlassCard
      className={`text-center cursor-pointer ${config.border} ${config.bg} hover:scale-105 transition-transform`}
      onClick={onClick}
    >
      <div className="relative inline-block mb-4">
        {contributor.avatar_url ? (
          <img
            src={contributor.avatar_url}
            alt={contributor.github_username}
            className={`w-20 h-20 rounded-full mx-auto border-4 ${
              rank === 1
                ? "border-yellow-500"
                : rank === 2
                ? "border-gray-400"
                : "border-amber-600"
            }`}
          />
        ) : (
          <div
            className={`w-20 h-20 rounded-full mx-auto bg-linear-to-br ${
              config.gradient
            } flex items-center justify-center border-4 ${
              rank === 1
                ? "border-yellow-500"
                : rank === 2
                ? "border-gray-400"
                : "border-amber-600"
            }`}
          >
            <span className="text-2xl font-bold text-white">
              {contributor.github_username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div
          className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-linear-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1 truncate">
        @{contributor.github_username}
      </h3>

      <div className="flex items-center justify-center gap-2 mb-4">
        <TrendingUp className={`w-5 h-5 ${config.iconColor}`} />
        <span className="text-2xl font-bold text-white">
          {contributor.impact_score}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 bg-white/5 rounded-lg">
          <p className="text-gray-400">Commits</p>
          <p className="font-semibold text-white">
            {contributor.total_commits}
          </p>
        </div>
        <div className="p-2 bg-white/5 rounded-lg">
          <p className="text-gray-400">PRs</p>
          <p className="font-semibold text-white">
            {contributor.prs_merged}/{contributor.prs_opened}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function LeaderboardRow({
  contributor,
  rank,
  onClick,
}: {
  contributor: Contributor;
  rank: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
    >
      <div className="w-8 h-8 flex items-center justify-center text-gray-500 font-semibold">
        #{rank}
      </div>

      <div className="relative">
        {contributor.avatar_url ? (
          <img
            src={contributor.avatar_url}
            alt={contributor.github_username}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {contributor.github_username[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">
          @{contributor.github_username}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{contributor.total_commits} commits</span>
          <span>{contributor.prs_merged} PRs merged</span>
        </div>
      </div>

      <div className="text-right">
        <div className="flex items-center gap-1 text-violet-400">
          <TrendingUp className="w-4 h-4" />
          <span className="font-semibold text-lg">
            {contributor.impact_score}
          </span>
        </div>
      </div>
    </div>
  );
}

function ContributorModal({
  contributor,
  rank,
  onClose,
}: {
  contributor: Contributor;
  rank: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg">
        <GlassCard className="border border-white/10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {contributor.avatar_url ? (
                <img
                  src={contributor.avatar_url}
                  alt={contributor.github_username}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl text-white font-medium">
                    {contributor.github_username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold">
                #{rank}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                @{contributor.github_username}
              </h3>
              {contributor.email && (
                <p className="text-sm text-gray-400">{contributor.email}</p>
              )}
            </div>
          </div>

          {/* Impact Score */}
          <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-xl border border-violet-500/20 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Impact Score</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-violet-400" />
                <span className="text-3xl font-bold text-white">
                  {contributor.impact_score}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatItem
              icon={GitCommit}
              label="Commits"
              value={contributor.total_commits}
              color="violet"
            />
            <StatItem
              icon={GitPullRequest}
              label="PRs Opened"
              value={contributor.prs_opened}
              color="blue"
            />
            <StatItem
              icon={GitMerge}
              label="PRs Merged"
              value={contributor.prs_merged}
              color="emerald"
            />
            <StatItem
              icon={CircleDot}
              label="Issues Opened"
              value={contributor.issues_opened}
              color="amber"
            />
          </div>

          {/* Code Stats */}
          <div className="p-4 bg-white/5 rounded-xl mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Code Changes
            </h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">
                  +{contributor.total_additions.toLocaleString()}
                </span>
                <span className="text-gray-500">additions</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-semibold">
                  -{contributor.total_deletions.toLocaleString()}
                </span>
                <span className="text-gray-500">deletions</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </GlassCard>
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "violet" | "blue" | "emerald" | "amber";
}) {
  const colorClasses = {
    violet: "text-violet-400 bg-violet-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
