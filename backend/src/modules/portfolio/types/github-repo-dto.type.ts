export interface GitHubRepoDto {
  name?: string;
  html_url?: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  private?: boolean;
  owner?: {
    login?: string;
  };
  updated_at?: string;
}
