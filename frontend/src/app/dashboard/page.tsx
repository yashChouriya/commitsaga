"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  AlertCircle,
  CheckCircle,
  Github,
  Plus,
  Sparkles,
  FolderGit2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { authApi } from "@/lib/auth";
import {
  MeshBackground,
  Navbar,
  GlassCard,
  Button,
  AnimatedSection,
} from "@/components/ui";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [patStatus, setPATStatus] = useState<{
    has_token: boolean;
    github_username: string | null;
  } | null>(null);
  const [loadingPAT, setLoadingPAT] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadPATStatus();
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MeshBackground />
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome Section */}
          <AnimatedSection animation="fade-up" delay={0}>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                Welcome back,{" "}
                <span className="gradient-text-static">{user.username}</span>!
              </h1>
              <p className="text-gray-400">
                Manage your repositories and view insights
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
                        <Button
                          variant="primary"
                          icon={<Github className="h-4 w-4" />}
                          iconPosition="left"
                        >
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
                { label: "Repositories", value: "0", icon: FolderGit2 },
                { label: "Total Commits", value: "0", icon: GitBranch },
                { label: "Contributors", value: "0", icon: Github },
                { label: "AI Summaries", value: "0", icon: Sparkles },
              ].map((stat, index) => (
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

          {/* Repositories Section */}
          <AnimatedSection animation="fade-up" delay={300}>
            <GlassCard className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
                  <FolderGit2 className="h-10 w-10 text-violet-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  No repositories yet
                </h3>
                <p className="text-gray-400 mb-8">
                  {patStatus?.has_token
                    ? "Add your first repository to start analyzing commit history and generating AI-powered insights."
                    : "Configure your GitHub token first, then add repositories to start analyzing."}
                </p>
                {patStatus?.has_token && (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<Plus className="h-5 w-5" />}
                    iconPosition="left"
                    disabled
                  >
                    Add Repository (Coming Soon)
                  </Button>
                )}
              </div>
            </GlassCard>
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
                      title: "Add Repository",
                      description:
                        "Enter a GitHub repository URL to start the analysis.",
                      action: null,
                      actionLabel: "Coming Soon",
                    },
                    {
                      step: "3",
                      title: "View Insights",
                      description:
                        "Explore AI-generated summaries and contributor statistics.",
                      action: null,
                      actionLabel: "Coming Soon",
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
    </div>
  );
}
