// User types
export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

// Repository types
export interface Repository {
  id: number;
  user_id: number;
  github_repo_url: string;
  repo_name: string;
  owner: string;
  default_branch: string;
  selected_branch: string;
  last_analyzed_at: string | null;
  analysis_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  cron_enabled: boolean;
  cron_frequency: 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

// Contributor types
export interface Contributor {
  id: number;
  repository_id: number;
  github_username: string;
  email: string | null;
  total_score: number;
  score_breakdown: {
    commit_volume: number;
    code_impact: number;
    pr_quality: number;
    issue_resolution: number;
    consistency: number;
    collaboration: number;
  };
  metrics: {
    total_commits: number;
    lines_added: number;
    lines_deleted: number;
    prs_merged: number;
    prs_reviewed: number;
    issues_resolved: number;
    active_weeks: number;
    total_weeks: number;
  };
  ai_summary: string;
  primary_badge: string;
  special_badges: string[];
  rank: number;
}

// Commit Group types
export interface CommitGroup {
  id: number;
  repository_id: number;
  group_type: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  commit_count: number;
  summary: string;
  key_changes: string[];
  analyzed_at: string;
}

// Pull Request types
export interface PullRequest {
  id: number;
  repository_id: number;
  pr_number: number;
  title: string;
  description: string;
  author: string;
  state: 'open' | 'closed' | 'merged';
  created_at_github: string;
  merged_at: string | null;
  discussion: any[];
  commit_shas: string[];
}

// Issue types
export interface Issue {
  id: number;
  repository_id: number;
  issue_number: number;
  title: string;
  description: string;
  state: 'open' | 'closed';
  labels: string[];
  created_at_github: string;
  closed_at: string | null;
  resolution_pr_id: number | null;
  discussion: any[];
}

// Overall Summary types
export interface OverallSummary {
  id: number;
  repository_id: number;
  summary_text: string;
  total_commits: number;
  total_contributors: number;
  analysis_period_start: string;
  analysis_period_end: string;
  generated_at: string;
}

// Export types
export interface Export {
  id: number;
  repository_id: number;
  export_type: 'weekly' | 'monthly' | 'complete';
  date_range_start: string | null;
  date_range_end: string | null;
  file_path: string;
  file_size: number;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
