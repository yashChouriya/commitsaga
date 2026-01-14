"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  Github,
  CheckCircle,
  XCircle,
  Loader,
  User,
  Mail,
  Key,
  ExternalLink,
  Shield,
} from "lucide-react";
import { authApi } from "@/lib/auth";
import {
  MeshBackground,
  Navbar,
  GlassCard,
  GlassInput,
  Button,
  AnimatedSection,
} from "@/components/ui";

export default function SettingsPage() {
  const { user, loading, updateUser, refreshUser } = useAuth();
  const router = useRouter();

  const [githubToken, setGithubToken] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "",
  });
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setGithubUsername(user.github_username || "");
    }
  }, [user]);

  const handleValidateToken = async () => {
    if (!githubToken.trim()) {
      setValidation({
        status: "error",
        message: "Please enter a GitHub token",
      });
      return;
    }

    setValidating(true);
    setValidation({ status: "idle", message: "" });

    try {
      const result = await authApi.validateGitHubPAT(githubToken);
      if (result.is_valid) {
        setValidation({
          status: "success",
          message: `Token is valid! Authenticated as @${result.username}`,
        });
        setGithubUsername(result.username || "");
      } else {
        setValidation({ status: "error", message: result.message });
      }
    } catch (error: any) {
      setValidation({
        status: "error",
        message: error.response?.data?.message || "Failed to validate token",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      await updateUser({
        github_username: githubUsername,
        github_token: githubToken || undefined,
      });
      await refreshUser();
      setSaveMessage({ type: "success", text: "Settings saved successfully!" });
      setGithubToken("");
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setSaving(false);
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
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <AnimatedSection animation="fade-up" delay={0}>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <SettingsIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
              </div>
              <p className="text-gray-400">
                Manage your account and GitHub integration
              </p>
            </div>
          </AnimatedSection>

          {/* Profile Section */}
          <AnimatedSection animation="fade-up" delay={100}>
            <GlassCard className="mb-6">
              <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                <User className="h-5 w-5 text-violet-400" />
                Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full glass-input rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      className="w-full glass-input rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* GitHub Integration Section */}
          <AnimatedSection animation="fade-up" delay={200}>
            <GlassCard>
              <div className="flex items-center gap-2 mb-6">
                <Github className="h-6 w-6 text-violet-400" />
                <h2 className="text-xl font-semibold text-white">
                  GitHub Integration
                </h2>
              </div>

              <p className="text-gray-400 mb-6">
                Connect your GitHub account using a Personal Access Token (PAT)
                to analyze repositories.
              </p>

              {/* Instructions */}
              <div className="glass rounded-xl p-5 mb-6 border-violet-500/20">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4 text-violet-400" />
                  How to create a GitHub PAT:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                  <li>
                    Go to{" "}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                    >
                      GitHub Settings → Developer settings → Personal access
                      tokens
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Click "Generate new token (classic)"</li>
                  <li>
                    Select scopes:{" "}
                    <code className="bg-violet-500/20 px-2 py-0.5 rounded text-violet-300">
                      repo
                    </code>{" "}
                    (full control of private repositories)
                  </li>
                  <li>Click "Generate token" and copy it</li>
                </ol>
              </div>

              {/* Current Status */}
              {user.has_github_token && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-300">
                      GitHub token configured
                    </p>
                    {user.github_username && (
                      <p className="text-sm text-emerald-400/80">
                        Connected as @{user.github_username}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Token Input */}
                <div>
                  <label
                    htmlFor="github-token"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    GitHub Personal Access Token
                  </label>
                  <GlassInput
                    id="github-token"
                    type="password"
                    value={githubToken}
                    onChange={(e) => {
                      setGithubToken(e.target.value);
                      setValidation({ status: "idle", message: "" });
                    }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    icon={<Key className="h-5 w-5" />}
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Your token is encrypted and stored securely
                  </p>
                </div>

                {/* Validation Button */}
                <div>
                  <Button
                    variant="secondary"
                    onClick={handleValidateToken}
                    disabled={validating || !githubToken.trim()}
                    loading={validating}
                  >
                    {validating ? "Validating..." : "Validate Token"}
                  </Button>

                  {validation.status !== "idle" && (
                    <div
                      className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
                        validation.status === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      }`}
                    >
                      {validation.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                      )}
                      <p
                        className={`text-sm ${
                          validation.status === "success"
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {validation.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* GitHub Username (auto-filled after validation) */}
                {githubUsername && (
                  <div>
                    <label
                      htmlFor="github-username"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      GitHub Username
                    </label>
                    <GlassInput
                      id="github-username"
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      icon={<Github className="h-5 w-5" />}
                    />
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-6 border-t border-white/10">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>

                  {saveMessage && (
                    <p
                      className={`mt-4 text-sm ${
                        saveMessage.type === "success"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {saveMessage.text}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
}
