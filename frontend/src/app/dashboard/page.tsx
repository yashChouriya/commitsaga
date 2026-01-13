'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GitBranch, Settings, LogOut, AlertCircle, CheckCircle, Github } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/auth';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [patStatus, setPATStatus] = useState<{ has_token: boolean; github_username: string | null } | null>(null);
  const [loadingPAT, setLoadingPAT] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
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
      console.error('Failed to load PAT status:', error);
    } finally {
      setLoadingPAT(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-6 w-6" />
              <span className="text-xl font-bold">CommitSaga</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/settings" className="flex items-center gap-2 text-gray-600 hover:text-black">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-black"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}!</h1>
          <p className="text-gray-600">Manage your repositories and view insights</p>
        </div>

        {/* GitHub PAT Status Card */}
        {!loadingPAT && (
          <div className="mb-8">
            {patStatus?.has_token ? (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">GitHub Connected</h3>
                    <p className="text-gray-600 mb-3">
                      Your GitHub account is connected as <strong>@{patStatus.github_username}</strong>
                    </p>
                    <Link
                      href="/settings"
                      className="text-sm text-black hover:underline font-medium"
                    >
                      Update GitHub Token →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">GitHub Token Required</h3>
                    <p className="text-gray-700 mb-4">
                      To analyze repositories, you need to connect your GitHub account with a Personal Access Token (PAT).
                    </p>
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                    >
                      <Github className="h-4 w-4" />
                      Configure GitHub Token
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Repositories Section */}
        <div className="bg-white p-8 rounded-lg border shadow-sm">
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitBranch className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No repositories yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {patStatus?.has_token
                ? 'Add your first repository to start analyzing commit history and generating insights.'
                : 'Configure your GitHub token to start adding repositories.'}
            </p>
            {patStatus?.has_token && (
              <button
                disabled
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Repository (Coming Soon)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
