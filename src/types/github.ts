export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  milestone: {
    title: string;
    description: string | null;
    due_on: string | null;
  } | null;
}

export interface ProjectItem {
  id: string;
  content: GitHubIssue;
  fieldValues: {
    nodes: Array<{
      field: {
        name: string;
      };
      value?: string;
      date?: string;
    }>;
  };
}

export interface ProjectView {
  id: string;
  name: string;
  items: {
    nodes: ProjectItem[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date | null;
  url: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  status: 'open' | 'closed';
  type: 'issue' | 'milestone';
}
