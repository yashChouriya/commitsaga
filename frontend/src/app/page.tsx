import Link from 'next/link';
import { ArrowRight, GitBranch, Users, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-8 w-8" />
            <span className="text-2xl font-bold">CommitSaga</span>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Every Commit Tells a Story
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your repository history into meaningful insights with AI-powered analysis,
            contributor gamification, and comprehensive code archaeology.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              Start Analyzing <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <GitBranch className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Get intelligent summaries of commit groups, pull requests, and issues using Claude AI to understand the "why" behind code changes.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Contributor Gamification</h3>
            <p className="text-gray-600">
              Recognize team members with impact scores, badges, and detailed contribution breakdowns across multiple metrics.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Code Archaeology</h3>
            <p className="text-gray-600">
              Discover past problems and solutions, understand architectural decisions, and learn from historical context.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t text-center text-gray-600">
        <p>Built with love for developers who believe every commit tells a story</p>
      </footer>
    </div>
  );
}
