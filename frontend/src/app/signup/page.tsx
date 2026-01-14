"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import {
  AuthBackground,
  GlassCard,
  GlassInput,
  Button,
  AnimatedSection,
} from "@/components/ui";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, signup } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await signup(email, username, password, password2);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        const errorMessage =
          errorData.email?.[0] ||
          errorData.username?.[0] ||
          errorData.password?.[0] ||
          errorData.password2?.[0] ||
          errorData.non_field_errors?.[0] ||
          "Failed to create account. Please try again.";
        setError(errorMessage);
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null;
  }

  const passwordRequirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    {
      met: password === password2 && password.length > 0,
      text: "Passwords match",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <AuthBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <AnimatedSection animation="fade-down" delay={0}>
          <Link
            href="/"
            className="flex items-center justify-center gap-3 mb-8 group"
          >
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:glow-sm transition-all">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CommitSaga</span>
          </Link>
        </AnimatedSection>

        {/* Header */}
        <AnimatedSection animation="fade-up" delay={100}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create your account
            </h1>
            <p className="text-gray-400">
              Start analyzing your repositories today
            </p>
          </div>
        </AnimatedSection>

        {/* Signup Form */}
        <AnimatedSection animation="fade-up" delay={200}>
          <GlassCard className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email
                </label>
                <GlassInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  icon={<Mail className="w-5 h-5" />}
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Username
                </label>
                <GlassInput
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="johndoe"
                  icon={<User className="w-5 h-5" />}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <GlassInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                />
              </div>

              <div>
                <label
                  htmlFor="password2"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <GlassInput
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                />
              </div>

              {/* Password Requirements */}
              {password.length > 0 && (
                <div className="space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle
                        className={`w-4 h-4 ${
                          req.met ? "text-green-400" : "text-gray-600"
                        }`}
                      />
                      <span
                        className={req.met ? "text-green-400" : "text-gray-500"}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                icon={!loading ? <ArrowRight className="w-5 h-5" /> : undefined}
              >
                Create account
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Back to home */}
        <AnimatedSection animation="fade-up" delay={300}>
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors inline-flex items-center gap-2"
            >
              ← Back to home
            </Link>
          </div>
        </AnimatedSection>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full filter blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full filter blur-[80px] pointer-events-none" />
      </div>
    </div>
  );
}
