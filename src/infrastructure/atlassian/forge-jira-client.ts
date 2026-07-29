import api, { route } from '@forge/api';
import type { JiraDiagnostic } from '../../core/domain/executive';
import type {
  JiraBoard,
  JiraClient,
  JiraIssue,
  JiraSearchRequest,
  JiraSprint,
} from '../../core/ports/jira-client';

export class JiraRequestError extends Error {
  constructor(
    message: string,
    readonly diagnostic: JiraDiagnostic,
  ) {
    super(message);
  }
}

export class ForgeJiraClient implements JiraClient {
  private diagnostics: JiraDiagnostic[] = [];

  async searchIssues(request: JiraSearchRequest): Promise<JiraIssue[]> {
    const operationStartedAt = Date.now();
    const issues: JiraIssue[] = [];
    let nextPageToken: string | undefined;
    const pageSize = 100;
    while (issues.length < request.maxResults) {
      const startedAt = Date.now();
      const endpoint = '/rest/api/3/search/jql';
      const response = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jql: request.jql,
          fields: request.fields,
          maxResults: Math.min(pageSize, request.maxResults - issues.length),
          ...(nextPageToken ? { nextPageToken } : {}),
        }),
      });
      if (!response.ok)
        throw this.failure('searchIssues', endpoint, 'POST', response.status, startedAt, {
          projectKey: request.projectKey,
          jql: request.jql,
          source: 'jira-platform',
          possibleScope: 'read:jira-work',
        });
      const payload = (await response.json()) as {
        issues?: JiraIssue[];
        nextPageToken?: string;
        isLast?: boolean;
      };
      issues.push(...(payload.issues ?? []));
      nextPageToken = payload.nextPageToken;
      if (payload.isLast || !payload.issues?.length || !nextPageToken) break;
    }
    this.success(
      'searchIssues',
      '/rest/api/3/search/jql',
      'POST',
      issues.length,
      operationStartedAt,
      {
        projectKey: request.projectKey,
        jql: request.jql,
        source: 'jira-platform',
      },
    );
    return issues;
  }
  async getCurrentUserTenant(): Promise<string> {
    const response = await api.asUser().requestJira(route`/rest/api/3/myself`);
    if (!response.ok) throw new Error(`Current user lookup failed with ${response.status}`);
    const user = (await response.json()) as { accountId: string };
    return user.accountId;
  }
  async getBoard(boardId: number): Promise<JiraBoard> {
    const startedAt = Date.now();
    const endpoint = `/rest/agile/1.0/board/${boardId}`;
    const response = await api.asUser().requestJira(route`/rest/agile/1.0/board/${boardId}`);
    if (!response.ok)
      throw this.failure('getBoard', endpoint, 'GET', response.status, startedAt, {
        boardId,
        source: 'jira-software',
        possibleScope: 'read:board-scope:jira-software',
      });
    const board = (await response.json()) as JiraBoard;
    this.success('getBoard', endpoint, 'GET', 1, startedAt, {
      boardId,
      source: 'jira-software',
    });
    return board;
  }

  async getActiveSprints(boardId: number): Promise<JiraSprint[]> {
    const startedAt = Date.now();
    const endpoint = `/rest/agile/1.0/board/${boardId}/sprint?state=active`;
    const response = await api
      .asUser()
      .requestJira(route`/rest/agile/1.0/board/${boardId}/sprint?state=active&maxResults=50`);
    if (!response.ok)
      throw this.failure('getActiveSprints', endpoint, 'GET', response.status, startedAt, {
        boardId,
        source: 'jira-software',
        possibleScope: 'read:sprint:jira-software',
      });
    const payload = (await response.json()) as { values?: JiraSprint[] };
    const sprints = payload.values ?? [];
    this.success('getActiveSprints', endpoint, 'GET', sprints.length, startedAt, {
      boardId,
      source: 'jira-software',
    });
    return sprints;
  }

  getDiagnostics(): JiraDiagnostic[] {
    return this.diagnostics.slice();
  }

  private success(
    operation: string,
    endpoint: string,
    method: 'GET' | 'POST',
    itemCount: number,
    startedAt: number,
    context: Partial<JiraDiagnostic> & { source: JiraDiagnostic['source'] },
  ) {
    const timestamp = new Date().toISOString();
    this.diagnostics.push({
      operation,
      endpoint,
      method,
      timestamp,
      durationMs: Date.now() - startedAt,
      result: itemCount ? 'success' : 'empty',
      httpStatus: 200,
      itemCount,
      lastSuccessfulAt: timestamp,
      ...context,
    });
  }

  private failure(
    operation: string,
    endpoint: string,
    method: 'GET' | 'POST',
    httpStatus: number,
    startedAt: number,
    context: Partial<JiraDiagnostic> & { source: JiraDiagnostic['source'] },
  ): JiraRequestError {
    const diagnostic: JiraDiagnostic = {
      operation,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      result: 'error',
      httpStatus,
      safeMessage: `Jira ${operation} failed with HTTP ${httpStatus}.`,
      ...context,
    };
    this.diagnostics.push(diagnostic);
    return new JiraRequestError(diagnostic.safeMessage!, diagnostic);
  }
}
