import type { JiraDiagnostic } from '../domain/executive';

export interface JiraSearchRequest {
  jql: string;
  fields: string[];
  maxResults: number;
  projectKey?: string;
}
export interface JiraIssue {
  key: string;
  fields: Record<string, unknown>;
}
export interface JiraBoard {
  id: number;
  name: string;
}
export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}
export interface JiraClient {
  searchIssues(request: JiraSearchRequest): Promise<JiraIssue[]>;
  getCurrentUserTenant(): Promise<string>;
  getBoard(boardId: number): Promise<JiraBoard>;
  getActiveSprints(boardId: number): Promise<JiraSprint[]>;
  getDiagnostics(): JiraDiagnostic[];
}
