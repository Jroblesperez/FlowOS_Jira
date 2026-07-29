import api, { route } from '@forge/api';
import type { JiraClient, JiraIssue, JiraSearchRequest } from '../../core/ports/jira-client';

export class ForgeJiraClient implements JiraClient {
  async searchIssues(request: JiraSearchRequest): Promise<JiraIssue[]> {
    const issues: JiraIssue[] = [];
    let startAt = 0;
    const pageSize = 100;
    while (issues.length < request.maxResults) {
      const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          startAt,
          maxResults: Math.min(pageSize, request.maxResults - issues.length),
        }),
      });
      if (!response.ok) throw new Error(`Jira search failed with ${response.status}`);
      const payload = (await response.json()) as { issues?: JiraIssue[]; total?: number };
      issues.push(...(payload.issues ?? []));
      if (!payload.issues?.length || issues.length >= (payload.total ?? 0)) break;
      startAt += pageSize;
    }
    return issues;
  }
  async getCurrentUserTenant(): Promise<string> {
    const response = await api.asUser().requestJira(route`/rest/api/3/myself`);
    if (!response.ok) throw new Error(`Current user lookup failed with ${response.status}`);
    const user = (await response.json()) as { accountId: string };
    return user.accountId;
  }
  async countActiveSprints(): Promise<number> {
    const boards = await api.asUser().requestJira(route`/rest/agile/1.0/board?maxResults=50`);
    if (!boards.ok) return 0;
    const payload = (await boards.json()) as { values?: { id: number }[] };
    const counts = await Promise.all(
      (payload.values ?? []).slice(0, 10).map(async (board) => {
        const response = await api
          .asUser()
          .requestJira(route`/rest/agile/1.0/board/${board.id}/sprint?state=active&maxResults=50`);
        if (!response.ok) return 0;
        const sprints = (await response.json()) as { values?: unknown[] };
        return sprints.values?.length ?? 0;
      }),
    );
    return counts.reduce((total, count) => total + count, 0);
  }
}
