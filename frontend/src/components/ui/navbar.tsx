"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  GitBranch,
  LogOut,
  Settings,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:glow-sm transition-all">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CommitSaga</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {loading ? (
                <div className="w-24 h-10 glass rounded-xl animate-pulse" />
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 top-[73px] border-b border-white/10 transition-all duration-300",
          "bg-white/10 backdrop-blur-2xl backdrop-saturate-150",
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
          {loading ? (
            <div className="w-full h-10 bg-white/5 rounded-xl animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 text-white font-semibold hover:text-violet-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 text-white font-semibold hover:text-violet-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-white font-semibold hover:text-violet-400 transition-colors py-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white font-semibold hover:text-violet-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
