'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GitBranch, Settings as SettingsIcon, ArrowLeft, Github, CheckCircle, XCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/auth';

export default function SettingsPage() {
  const { user, loading, updateUser, refreshUser } = useAuth();
  const router = useRouter();

  const [githubToken, setGithubToken] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setGithubUsername(user.github_username || '');
    }
  }, [user]);

  const handleValidateToken = async () => {
    if (!githubToken.trim()) {
      setValidation({ status: 'error', message: 'Please enter a GitHub token' });
      return;
    }

    setValidating(true);
    setValidation({ status: 'idle', message: '' });

    try {
      const result = await authApi.validateGitHubPAT(githubToken);
      if (result.is_valid) {
        setValidation({ status: 'success', message: `Token is valid! Authenticated as @${result.username}` });
        setGithubUsername(result.username || '');
      } else {
        setValidation({ status: 'error', message: result.message });
      }
    } catch (error: any) {
      setValidation({ status: 'error', message: error.response?.data?.message || 'Failed to validate token' });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      await updateUser({
        github_username: githubUsername,
        github_token: githubToken || undefined,
      });
      await refreshUser();
      setSaveMessage('Settings saved successfully!');
      setGithubToken(''); // Clear the input field for security
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-600">Manage your account and GitHub integration</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white p-6 rounded-lg border shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* GitHub Integration Section */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Github className="h-6 w-6" />
            <h2 className="text-xl font-semibold">GitHub Integration</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Connect your GitHub account using a Personal Access Token (PAT) to analyze repositories.
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to create a GitHub PAT:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select scopes: <code className="bg-blue-100 px-1 rounded">repo</code> (full control of private repositories)</li>
              <li>Click "Generate token" and copy it</li>
            </ol>
          </div>

          {/* Current Status */}
          {user.has_github_token && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">GitHub token configured</p>
                {user.github_username && (
                  <p className="text-sm text-green-700">Connected as @{user.github_username}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Personal Access Token
              </label>
              <input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  setValidation({ status: 'idle', message: '' });
                }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your token is encrypted and stored securely
              </p>
            </div>

            {/* Validation */}
            <div>
              <button
                onClick={handleValidateToken}
                disabled={validating || !githubToken.trim()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {validating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Token'
                )}
              </button>

              {validation.status !== 'idle' && (
                <div className={`mt-3 p-3 rounded-md flex items-start gap-2 ${
                  validation.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {validation.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${validation.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {validation.message}
                  </p>
                </div>
              )}
            </div>

            {/* GitHub Username (auto-filled after validation) */}
            {githubUsername && (
              <div>
                <label htmlFor="github-username" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username
                </label>
                <input
                  id="github-username"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              {saveMessage && (
                <p className={`mt-3 text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
