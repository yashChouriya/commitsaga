// User types
export interface User {
  id: string;
  email: string;
  username: string;
  github_username: string;
  has_github_token: boolean;
  created_at: string;
  updated_at: string;
}

// Repository types
export type AnalysisStatus =
  | "pending"
  | "fetching"
  | "analyzing"
  | "completed"
  | "failed";
export type CronFrequency = "weekly" | "monthly";

export interface Repository {
  id: string;
  github_repo_url: string;
  repo_name: string;
  owner: string;
  description: string | null;
  default_branch: string;
  selected_branch: string | null;
  branch: string;
  full_name: string;
  analysis_status: AnalysisStatus;
  last_analyzed_at: string | null;
  analysis_error: string | null;
  cron_enabled: boolean;
  cron_frequency: CronFrequency | null;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  contributors_count: number;
  commits_count: number;
  prs_count: number;
  issues_count: number;
  created_at: string;
  updated_at: string;
}

export interface RepositoryListItem {
  id: string;
  github_repo_url: string;
  repo_name: string;
  owner: string;
  full_name: string;
  description: string | null;
  branch: string;
  analysis_status: AnalysisStatus;
  last_analyzed_at: string | null;
  stars_count: number;
  forks_count: number;
  contributors_count: number;
  commits_count: number;
  cron_enabled: boolean;
  created_at: string;
}

// Contributor types
export interface Contributor {
  id: string;
  github_username: string;
  github_id: number | null;
  avatar_url: string | null;
  email: string | null;
  total_commits: number;
  total_additions: number;
  total_deletions: number;
  prs_opened: number;
  prs_merged: number;
  issues_opened: number;
  issues_closed: number;
  impact_score: number;
  created_at: string;
  updated_at: string;
}

// Commit Data types
export interface CommitData {
  id: string;
  commit_sha: string;
  commit_message: string;
  commit_date: string;
  author_name: string;
  author_email: string | null;
  files_changed: Array<{
    filename: string;
    additions: number;
    deletions: number;
    status: string;
  }>;
  additions: number;
  deletions: number;
  contributor_username: string | null;
  created_at: string;
}

// Commit Group types
export interface CommitGroup {
  id: string;
  group_type: "weekly" | "monthly";
  start_date: string;
  end_date: string;
  commit_count: number;
  summary: string | null;
  key_changes: string[];
  notable_features: string[];
  bug_fixes: string[];
  technical_decisions: string[];
  main_contributors: string[];
  analyzed_at: string | null;
  commits?: CommitData[];
  created_at: string;
  updated_at: string;
}

export interface CommitGroupListItem {
  id: string;
  group_type: "weekly" | "monthly";
  start_date: string;
  end_date: string;
  commit_count: number;
  summary: string | null;
  analyzed_at: string | null;
  created_at: string;
}

// Pull Request types
export type PRState = "open" | "closed" | "merged";

export interface PRComment {
  author: string;
  body: string;
  created_at: string;
}

export interface PullRequest {
  id: string;
  pr_number: number;
  title: string;
  description: string | null;
  author: string;
  author_avatar_url: string | null;
  state: PRState;
  created_at_github: string;
  updated_at_github: string | null;
  merged_at: string | null;
  closed_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  commit_shas: string[];
  labels: string[];
  discussion: PRComment[];
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface PullRequestListItem {
  id: string;
  pr_number: number;
  title: string;
  author: string;
  author_avatar_url: string | null;
  state: PRState;
  created_at_github: string;
  merged_at: string | null;
  labels: string[];
}

// Issue types
export type IssueState = "open" | "closed";

export interface IssueComment {
  author: string;
  body: string;
  created_at: string;
}

export interface Issue {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  author: string;
  author_avatar_url: string | null;
  state: IssueState;
  created_at_github: string;
  updated_at_github: string | null;
  closed_at: string | null;
  labels: string[];
  discussion: IssueComment[];
  ai_summary: string | null;
  problem_description: string | null;
  solution_description: string | null;
  resolution_pr_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface IssueListItem {
  id: string;
  issue_number: number;
  title: string;
  author: string;
  author_avatar_url: string | null;
  state: IssueState;
  created_at_github: string;
  closed_at: string | null;
  labels: string[];
}

// Overall Summary types
export interface OverallSummary {
  id: string;
  summary_text: string;
  total_commits: number;
  total_contributors: number;
  total_prs: number;
  total_issues: number;
  analysis_period_start: string | null;
  analysis_period_end: string | null;
  generated_at: string;
  created_at: string;
}

// Export types
export type ExportType = "weekly" | "monthly" | "complete";

export interface Export {
  id: string;
  export_type: ExportType;
  date_range_start: string | null;
  date_range_end: string | null;
  file_path: string;
  file_size: number;
  download_url: string;
  created_at: string;
}

// Repository Stats
export interface RepositoryStats {
  repository: string;
  analysis_status: AnalysisStatus;
  last_analyzed_at: string | null;
  stats: {
    total_commits: number;
    total_contributors: number;
    total_prs: number;
    total_issues: number;
    open_prs: number;
    merged_prs: number;
    open_issues: number;
    closed_issues: number;
  };
  github_stats: {
    stars: number;
    forks: number;
    open_issues: number;
  };
}

// Branches
export interface BranchesResponse {
  branches: string[];
  default_branch: string;
  selected_branch: string | null;
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
