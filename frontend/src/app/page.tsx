"use client";

import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Users,
  FileText,
  Sparkles,
  Trophy,
  Clock,
  Download,
  Zap,
  Shield,
  TrendingUp,
  Search,
  GitPullRequest,
  GitCommit,
  MessageSquare,
} from "lucide-react";
import {
  Navbar,
  MeshBackground,
  Button,
  FeatureCard,
  GlassCard,
  AnimatedSection,
} from "@/components/ui";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MeshBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            {/* Badge */}
            <AnimatedSection animation="fade-down" delay={0}>
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-gray-300">
                  AI-Powered Repository Analysis
                </span>
              </div>
            </AnimatedSection>

            {/* Main Heading */}
            <AnimatedSection animation="fade-up" delay={100}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Every Commit
                <br />
                <span className="gradient-text">Tells a Story</span>
              </h1>
            </AnimatedSection>

            {/* Subheading */}
            <AnimatedSection animation="fade-up" delay={200}>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Transform your repository history into meaningful insights with
                AI-powered analysis, contributor gamification, and comprehensive
                code archaeology.
              </p>
            </AnimatedSection>

            {/* CTA Buttons */}
            <AnimatedSection animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Start Analyzing Free
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="secondary" size="lg">
                    See How It Works
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Hero Visual */}
            <AnimatedSection animation="scale" delay={500}>
              <div className="mt-16 relative">
                <div className="glass-card rounded-3xl p-8 max-w-4xl mx-auto">
                  {/* Mock Terminal Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-4 text-sm text-gray-500">
                      commitsaga analysis
                    </span>
                  </div>

                  {/* Mock Analysis Output */}
                  <div className="text-left space-y-4 font-mono text-sm">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-4 h-4 text-violet-400" />
                      <span className="text-gray-400">Analyzing</span>
                      <span className="text-cyan-400">
                        your-awesome-project
                      </span>
                    </div>
                    <div className="pl-7 space-y-2">
                      <div className="flex items-center gap-2">
                        <GitCommit className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">
                          1,247 commits analyzed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">
                          23 contributors scored
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300">
                          156 PRs summarized
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">
                          89 issues connected
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                        <span className="text-violet-400">AI Summary:</span>
                      </div>
                      <p className="text-gray-300 mt-2 pl-6">
                        "This week focused on authentication improvements and
                        API performance optimization. Key contributors: @sarah
                        (impact: 850), @mike (impact: 720)..."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 glass-card rounded-2xl p-4 animate-float hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Top Contributor
                      </p>
                      <p className="text-xs text-gray-400">@sarah • 850 pts</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 glass-card rounded-2xl p-4 animate-float-slow hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Weekly Report
                      </p>
                      <p className="text-xs text-gray-400">
                        Generated automatically
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Powerful Features for
              <span className="gradient-text-static"> Modern Teams</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to understand your codebase evolution and
              recognize your team's contributions.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Analysis"
              description="Get intelligent summaries of commit groups, pull requests, and issues using Claude AI to understand the 'why' behind code changes."
              gradient="from-violet-500 to-purple-600"
              delay={100}
            />
            <FeatureCard
              icon={Trophy}
              title="Contributor Gamification"
              description="Recognize team members with impact scores, badges, and detailed contribution breakdowns across multiple metrics."
              gradient="from-amber-500 to-orange-600"
              delay={200}
            />
            <FeatureCard
              icon={Search}
              title="Code Archaeology"
              description="Discover past problems and solutions, understand architectural decisions, and learn from historical context."
              gradient="from-cyan-500 to-blue-600"
              delay={300}
            />
            <FeatureCard
              icon={Clock}
              title="Timeline Visualization"
              description="Interactive timelines showing how your codebase evolved over time with weekly and monthly commit groupings."
              gradient="from-pink-500 to-rose-600"
              delay={400}
            />
            <FeatureCard
              icon={Download}
              title="AI-Friendly Exports"
              description="Generate structured markdown exports optimized for LLM consumption - perfect for feeding to AI assistants."
              gradient="from-emerald-500 to-green-600"
              delay={500}
            />
            <FeatureCard
              icon={Zap}
              title="Automated Updates"
              description="Set up scheduled analysis to automatically process new commits weekly or monthly without lifting a finger."
              gradient="from-indigo-500 to-violet-600"
              delay={600}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How It
              <span className="gradient-text-static"> Works</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Three simple steps to unlock the story behind your code.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Repository",
                description:
                  "Add your GitHub repository URL and authenticate with your Personal Access Token.",
                icon: GitBranch,
              },
              {
                step: "02",
                title: "AI Analysis",
                description:
                  "Our AI analyzes commits, PRs, and issues to extract meaningful insights and patterns.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Explore & Export",
                description:
                  "Browse interactive visualizations or export AI-friendly markdown for your workflows.",
                icon: TrendingUp,
              },
            ].map((item, index) => (
              <AnimatedSection
                key={item.step}
                animation="fade-up"
                delay={index * 150}
              >
                <GlassCard
                  hover
                  className="h-full relative overflow-hidden group"
                >
                  <div className="absolute top-4 right-4 text-6xl font-bold text-white/5 group-hover:text-violet-500/10 transition-colors">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-6 group-hover:from-violet-500/30 group-hover:to-purple-600/30 transition-all">
                      <item.icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Perfect For
              <span className="gradient-text-static"> Every Team</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From onboarding to knowledge preservation, CommitSaga helps teams
              work smarter.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Onboarding New Developers",
                description:
                  "Help new team members understand the codebase evolution and past architectural decisions quickly.",
                icon: Users,
                gradient: "from-blue-500/20 to-cyan-500/20",
              },
              {
                title: "Knowledge Preservation",
                description:
                  "Capture and preserve context around why code exists and what problems it solved.",
                icon: Shield,
                gradient: "from-emerald-500/20 to-green-500/20",
              },
              {
                title: "Learning from History",
                description:
                  "Avoid repeating past mistakes by understanding what was tried before and why.",
                icon: Clock,
                gradient: "from-amber-500/20 to-orange-500/20",
              },
              {
                title: "Team Recognition",
                description:
                  "Gamified contributor scoring to recognize and celebrate team member contributions.",
                icon: Trophy,
                gradient: "from-violet-500/20 to-purple-500/20",
              },
            ].map((item, index) => (
              <AnimatedSection
                key={item.title}
                animation="fade-up"
                delay={index * 100}
              >
                <GlassCard hover className="flex items-start gap-5">
                  <div
                    className={`w-14 h-14 rounded-xl bg-linear-to-br ${item.gradient} flex items-center justify-center shrink-0`}
                  >
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection animation="scale">
            <GlassCard className="text-center py-16 px-8 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-linear-to-r from-violet-600/10 via-purple-600/10 to-cyan-600/10" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Ready to Understand Your Code History?
                </h2>
                <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                  Join developers who are already using CommitSaga to unlock
                  insights from their repositories.
                </p>
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </GlassCard>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CommitSaga</span>
            </div>
            <p className="text-gray-500 text-sm">
              Built with love for developers who believe every commit tells a
              story.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
