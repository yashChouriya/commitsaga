'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User> & { github_token?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authApi.isAuthenticated()) {
        const userData = await authApi.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    router.push('/dashboard');
  };

  const signup = async (email: string, username: string, password: string, password2: string) => {
    const response = await authApi.signup({ email, username, password, password2 });
    setUser(response.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  };

  const updateUser = async (data: Partial<User> & { github_token?: string }) => {
    const response = await authApi.updateProfile(data);
    setUser(response.user);
  };

  const refreshUser = async () => {
    if (authApi.isAuthenticated()) {
      const userData = await authApi.getProfile();
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
