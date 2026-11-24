export interface GitLabProjectDto {
  name?: string;
  web_url?: string;
  description?: string | null;
  star_count?: number;
  visibility?: string;
  namespace?: {
    kind?: string;
    path?: string;
  };
  last_activity_at?: string;
  updated_at?: string;
}
