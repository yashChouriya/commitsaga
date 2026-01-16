import apiClient from "./api";
import type {
  Repository,
  RepositoryListItem,
  Contributor,
  CommitGroup,
  CommitGroupListItem,
  PullRequest,
  PullRequestListItem,
  Issue,
  IssueListItem,
  OverallSummary,
  RepositoryStats,
  BranchesResponse,
  Export,
  ExportType,
} from "@/types";

// DRF pagination response wrapper
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateRepositoryRequest {
  github_repo_url: string;
  selected_branch?: string;
}

export interface CreateRepositoryResponse {
  repository: Repository;
  message: string;
}

export interface DeleteRepositoryResponse {
  message: string;
}

export interface ReanalyzeResponse {
  message: string;
  repository: Repository;
}

export const repositoriesApi = {
  /**
   * Get all repositories for the current user
   */
  async list(): Promise<RepositoryListItem[]> {
    const response = await apiClient.get<PaginatedResponse<RepositoryListItem>>(
      "/api/repositories/"
    );
    return response.data.results;
  },

  /**
   * Get a single repository by ID
   */
  async get(id: string): Promise<Repository> {
    const response = await apiClient.get<Repository>(
      `/api/repositories/${id}/`
    );
    return response.data;
  },

  /**
   * Add a new repository
   */
  async create(
    data: CreateRepositoryRequest
  ): Promise<CreateRepositoryResponse> {
    const response = await apiClient.post<CreateRepositoryResponse>(
      "/api/repositories/",
      data
    );
    return response.data;
  },

  /**
   * Update repository settings
   */
  async update(
    id: string,
    data: {
      selected_branch?: string;
      cron_enabled?: boolean;
      cron_frequency?: "weekly" | "monthly";
    }
  ): Promise<Repository> {
    const response = await apiClient.patch<Repository>(
      `/api/repositories/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Delete a repository
   */
  async delete(id: string): Promise<DeleteRepositoryResponse> {
    const response = await apiClient.delete<DeleteRepositoryResponse>(
      `/api/repositories/${id}/`
    );
    return response.data;
  },

  /**
   * Trigger re-analysis of a repository
   */
  async reanalyze(id: string): Promise<ReanalyzeResponse> {
    const response = await apiClient.post<ReanalyzeResponse>(
      `/api/repositories/${id}/reanalyze/`
    );
    return response.data;
  },

  /**
   * Get contributors for a repository
   */
  async getContributors(id: string): Promise<Contributor[]> {
    const response = await apiClient.get<Contributor[]>(
      `/api/repositories/${id}/contributors/`
    );
    return response.data;
  },

  /**
   * Get commit groups for a repository
   */
  async getCommitGroups(
    id: string,
    detail: boolean = false
  ): Promise<CommitGroup[] | CommitGroupListItem[]> {
    const response = await apiClient.get<CommitGroup[] | CommitGroupListItem[]>(
      `/api/repositories/${id}/commit_groups/`,
      { params: { detail: detail.toString() } }
    );
    return response.data;
  },

  /**
   * Get pull requests for a repository
   */
  async getPullRequests(
    id: string,
    options?: {
      state?: "open" | "closed" | "merged";
      detail?: boolean;
    }
  ): Promise<PullRequest[] | PullRequestListItem[]> {
    const response = await apiClient.get<PullRequest[] | PullRequestListItem[]>(
      `/api/repositories/${id}/pull_requests/`,
      {
        params: {
          state: options?.state,
          detail: options?.detail?.toString(),
        },
      }
    );
    return response.data;
  },

  /**
   * Get issues for a repository
   */
  async getIssues(
    id: string,
    options?: {
      state?: "open" | "closed";
      detail?: boolean;
    }
  ): Promise<Issue[] | IssueListItem[]> {
    const response = await apiClient.get<Issue[] | IssueListItem[]>(
      `/api/repositories/${id}/issues/`,
      {
        params: {
          state: options?.state,
          detail: options?.detail?.toString(),
        },
      }
    );
    return response.data;
  },

  /**
   * Get the latest overall summary for a repository
   */
  async getSummary(id: string): Promise<OverallSummary> {
    const response = await apiClient.get<OverallSummary>(
      `/api/repositories/${id}/summary/`
    );
    return response.data;
  },

  /**
   * Get available branches for a repository
   */
  async getBranches(id: string): Promise<BranchesResponse> {
    const response = await apiClient.get<BranchesResponse>(
      `/api/repositories/${id}/branches/`
    );
    return response.data;
  },

  /**
   * Get statistics for a repository
   */
  async getStats(id: string): Promise<RepositoryStats> {
    const response = await apiClient.get<RepositoryStats>(
      `/api/repositories/${id}/stats/`
    );
    return response.data;
  },

  /**
   * Get all exports for a repository
   */
  async getExports(id: string): Promise<Export[]> {
    const response = await apiClient.get<Export[]>(
      `/api/repositories/${id}/exports/`
    );
    return response.data;
  },

  /**
   * Create a new export for a repository
   */
  async createExport(
    id: string,
    data: {
      export_type: ExportType;
      date_range_start?: string;
      date_range_end?: string;
    }
  ): Promise<{ message: string; task_id: string }> {
    const response = await apiClient.post<{ message: string; task_id: string }>(
      `/api/repositories/${id}/export/`,
      data
    );
    return response.data;
  },

  /**
   * Download an export file
   */
  async downloadExport(exportId: string, filename?: string): Promise<void> {
    const response = await apiClient.get(`/api/exports/${exportId}/download/`, {
      responseType: "blob",
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `export-${exportId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
