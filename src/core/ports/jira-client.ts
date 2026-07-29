export interface JiraSearchRequest {
  jql: string;
  fields: string[];
  maxResults: number;
}
export interface JiraIssue {
  key: string;
  fields: Record<string, unknown>;
}
export interface JiraClient {
  searchIssues(request: JiraSearchRequest): Promise<JiraIssue[]>;
  getCurrentUserTenant(): Promise<string>;
  countActiveSprints(): Promise<number>;
}
