"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { repositoriesApi } from "@/lib/repositories";
import type { Repository } from "@/types";
import {
  MeshBackground,
  Navbar,
  GlassCard,
  AnimatedSection,
} from "@/components/ui";
import {
  LayoutDashboard,
  GitCommit,
  Users,
  GitPullRequest,
  CircleDot,
  FileText,
  ArrowLeft,
  ExternalLink,
  Star,
  GitFork,
  Loader2,
  AlertCircle,
} from "lucide-react";

const navItems = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: GitCommit },
  { href: "/contributors", label: "Contributors", icon: Users },
  { href: "/prs", label: "Pull Requests", icon: GitPullRequest },
  { href: "/issues", label: "Issues", icon: CircleDot },
  { href: "/export", label: "Export", icon: FileText },
];

export default function RepositoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const repoId = params.id as string;

  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && repoId) {
      loadRepository();
    }
  }, [user, repoId]);

  const loadRepository = async () => {
    try {
      setLoading(true);
      setError(null);
      const repo = await repositoriesApi.get(repoId);
      setRepository(repo);
    } catch (err: any) {
      console.error("Failed to load repository:", err);
      setError(err.response?.data?.detail || "Failed to load repository");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const basePath = `/repos/${repoId}`;
  const currentPath = pathname.replace(basePath, "") || "";

  return (
    <div className="min-h-screen">
      <MeshBackground />
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-8xl">
          {/* Back Button & Repository Header */}
          <AnimatedSection animation="fade-up" delay={0}>
            <div className="mb-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>

              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  <span className="text-gray-400">Loading repository...</span>
                </div>
              ) : error ? (
                <GlassCard className="border-red-500/30 bg-red-500/5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Error Loading Repository
                      </h2>
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                </GlassCard>
              ) : repository ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">
                        {repository.full_name}
                      </h1>
                      <a
                        href={repository.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-violet-400 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    {repository.description && (
                      <p className="text-gray-400 max-w-2xl">
                        {repository.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {repository.stars_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                      <GitFork className="w-4 h-4 text-blue-400" />
                      {repository.forks_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </AnimatedSection>

          {/* Navigation Tabs */}
          {repository && (
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="mb-8 overflow-x-auto">
                <nav className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit min-w-full md:min-w-0">
                  {navItems.map((item) => {
                    const isActive = currentPath === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={`${basePath}${item.href}`}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          isActive
                            ? "bg-violet-500/20 text-violet-400"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </AnimatedSection>
          )}

          {/* Page Content */}
          {repository && children}
        </div>
      </main>
    </div>
  );
}
