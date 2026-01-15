"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { repositoriesApi } from "@/lib/repositories";
import type { CommitGroup } from "@/types";
import { GlassCard, AnimatedSection, Markdown } from "@/components/ui";
import {
  GitCommit,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCode,
  Bug,
  Lightbulb,
  Wrench,
  Users,
  Loader2,
} from "lucide-react";

export default function TimelinePage() {
  const params = useParams();
  const repoId = params.id as string;

  const [commitGroups, setCommitGroups] = useState<CommitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (repoId) {
      loadCommitGroups();
    }
  }, [repoId]);

  const loadCommitGroups = async () => {
    try {
      setLoading(true);
      const groups = (await repositoriesApi.getCommitGroups(
        repoId,
        true
      )) as CommitGroup[];
      setCommitGroups(groups);
      // Auto-expand first group
      if (groups.length > 0) {
        setExpandedGroups(new Set([groups[0].id]));
      }
    } catch (error) {
      console.error("Failed to load commit groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
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
      {/* Header */}
      <AnimatedSection animation="fade-up" delay={200}>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Development Timeline
              </h2>
              <p className="text-gray-400">
                {commitGroups.length} time periods analyzed with AI-generated
                insights
              </p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Timeline */}
      {commitGroups.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No timeline data yet
          </h3>
          <p className="text-gray-400">
            The analysis is still in progress or no commits have been found.
          </p>
        </GlassCard>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-blue-500 to-cyan-500 hidden md:block" />

          <div className="space-y-4">
            {commitGroups.map((group, index) => (
              <AnimatedSection
                key={group.id}
                animation="fade-up"
                delay={300 + index * 50}
              >
                <TimelineCard
                  group={group}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggle={() => toggleGroup(group.id)}
                />
              </AnimatedSection>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineCard({
  group,
  isExpanded,
  onToggle,
}: {
  group: CommitGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative md:pl-16">
      {/* Timeline dot */}
      <div className="absolute left-4 top-6 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 border-4 border-[#0a0a0f] hidden md:flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>

      <GlassCard
        className={`cursor-pointer transition-all ${isExpanded ? "ring-1 ring-violet-500/30" : ""}`}
        hover
      >
        {/* Header */}
        <div onClick={onToggle} className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
              <GitCommit className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  {formatDateRange(group.start_date, group.end_date)}
                </h3>
                <span className="text-xs px-2.5 py-1 bg-violet-500/20 text-violet-400 rounded-full font-medium">
                  {group.group_type}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {group.commit_count} commits
                {group.main_contributors.length > 0 &&
                  ` by ${group.main_contributors.slice(0, 3).join(", ")}${group.main_contributors.length > 3 ? " and others" : ""}`}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
            {/* AI Summary */}
            {group.summary && (
              <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-xl border border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400">
                    AI Summary
                  </span>
                </div>
                <Markdown content={group.summary} />
              </div>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Key Changes */}
              {group.key_changes.length > 0 && (
                <InsightSection
                  icon={FileCode}
                  title="Key Changes"
                  items={group.key_changes}
                  color="blue"
                />
              )}

              {/* Notable Features */}
              {group.notable_features.length > 0 && (
                <InsightSection
                  icon={Lightbulb}
                  title="Notable Features"
                  items={group.notable_features}
                  color="emerald"
                />
              )}

              {/* Bug Fixes */}
              {group.bug_fixes.length > 0 && (
                <InsightSection
                  icon={Bug}
                  title="Bug Fixes"
                  items={group.bug_fixes}
                  color="red"
                />
              )}

              {/* Technical Decisions */}
              {group.technical_decisions.length > 0 && (
                <InsightSection
                  icon={Wrench}
                  title="Technical Decisions"
                  items={group.technical_decisions}
                  color="amber"
                />
              )}
            </div>

            {/* Main Contributors */}
            {group.main_contributors.length > 0 && (
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">
                    Main Contributors
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.main_contributors.map((contributor) => (
                    <span
                      key={contributor}
                      className="px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white"
                    >
                      @{contributor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Commits Preview */}
            {group.commits && group.commits.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">
                  Recent Commits
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {group.commits.slice(0, 10).map((commit) => (
                    <div
                      key={commit.id}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <code className="text-xs text-violet-400 font-mono bg-violet-500/10 px-2 py-1 rounded">
                        {commit.commit_sha.slice(0, 7)}
                      </code>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">
                          {commit.commit_message.split("\n")[0]}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          by {commit.author_name} on{" "}
                          {formatDate(commit.commit_date)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        <span className="text-emerald-400">
                          +{commit.additions}
                        </span>
                        {" / "}
                        <span className="text-red-400">-{commit.deletions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function InsightSection({
  icon: Icon,
  title,
  items,
  color,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: "blue" | "emerald" | "red" | "amber";
}) {
  const colorClasses = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(" ")[0]}`} />
        <span className="text-sm font-medium text-gray-400">{title}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-2 ${colorClasses[color].split(" ")[0].replace("text-", "bg-")}`}
            />
            <span className="text-gray-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
