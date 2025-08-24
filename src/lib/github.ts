import { Octokit } from '@octokit/rest';
import { ProjectItem, CalendarEvent } from '@/types/github';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});



// GraphQL query for Projects v2
const PROJECT_V2_QUERY = `
  query($org: String!, $projectNumber: Int!, $cursor: String) {
    organization(login: $org) {
      projectV2(number: $projectNumber) {
        id
        title
        items(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            type
            content {
              ... on Issue {
                id
                number
                title
                body
                state
                createdAt
                updatedAt
                closedAt
                url
                author {
                  login
                  avatarUrl
                }
                labels(first: 20) {
                  nodes {
                    id
                    name
                    color
                    description
                  }
                }
                assignees(first: 10) {
                  nodes {
                    login
                    avatarUrl
                  }
                }
                milestone {
                  title
                  description
                  dueOn
                }
              }
            }
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldDateValue {
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                  date
                }
                ... on ProjectV2ItemFieldTextValue {
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                  text
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                  name
                }
                ... on ProjectV2ItemFieldNumberValue {
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                  number
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchProjectItems(
  org: string = 'squareup',
  projectNumber: number = 333,
  sinceDate?: Date
): Promise<ProjectItem[]> {
  const since = sinceDate || new Date('2025-08-01'); // Default to August 2025

  try {
    console.log('Attempting to use GraphQL API for Projects v2...');
    return await fetchProjectItemsGraphQL(org, projectNumber, since);
  } catch (graphqlError) {
    console.warn('GraphQL API failed, falling back to Search API:', graphqlError);
    return await fetchIssuesByLabel(org, since);
  }
}

async function fetchProjectItemsGraphQL(
  org: string,
  projectNumber: number,
  since: Date
): Promise<ProjectItem[]> {
  const allItems: ProjectItem[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response: any = await octokit.graphql(PROJECT_V2_QUERY, {
      org,
      projectNumber,
      cursor,
    });

    const project = response.organization.projectV2;
    if (!project) {
      throw new Error(`Project ${projectNumber} not found for organization ${org}`);
    }

    const items = project.items.nodes;

    // Filter items based on date and label
    const filteredItems = items.filter((item: any) => {
      if (!item.content || item.type !== 'ISSUE') return false;
      
      // Check if issue has the required label
      const hasRequiredLabel = item.content.labels?.nodes?.some(
        (label: any) => label.name === 'area: devrel-opensource'
      );
      
      if (!hasRequiredLabel) return false;

      // Check if issue was created after our since date
      const createdAt = new Date(item.content.createdAt);
      return createdAt >= since;
    });

    // Transform GraphQL response to our ProjectItem format
    const transformedItems: ProjectItem[] = filteredItems.map((item: any) => ({
      id: item.id,
      content: {
        id: item.content.id,
        number: item.content.number,
        title: item.content.title,
        body: item.content.body || '',
        state: item.content.state.toLowerCase(),
        created_at: item.content.createdAt,
        updated_at: item.content.updatedAt,
        closed_at: item.content.closedAt,
        html_url: item.content.url,
        user: {
          login: item.content.author?.login || '',
          avatar_url: item.content.author?.avatarUrl || '',
        },
        labels: item.content.labels?.nodes?.map((label: any) => ({
          id: label.id,
          name: label.name,
          color: label.color,
          description: label.description,
        })) || [],
        assignees: item.content.assignees?.nodes?.map((assignee: any) => ({
          login: assignee.login,
          avatar_url: assignee.avatarUrl,
        })) || [],
        milestone: item.content.milestone ? {
          title: item.content.milestone.title,
          description: item.content.milestone.description,
          due_on: item.content.milestone.dueOn,
        } : null,
      },
      fieldValues: {
        nodes: item.fieldValues.nodes.map((fieldValue: any) => ({
          field: {
            name: fieldValue.field?.name || '',
          },
          date: fieldValue.date || null,
          text: fieldValue.text || null,
          name: fieldValue.name || null,
          number: fieldValue.number || null,
        })),
      },
    }));

    allItems.push(...transformedItems);

    hasNextPage = project.items.pageInfo.hasNextPage;
    cursor = project.items.pageInfo.endCursor;
  }

  console.log(`Successfully fetched ${allItems.length} items using GraphQL API`);
  return allItems;
}

// Fallback function to search issues by label directly
async function fetchIssuesByLabel(
  org: string,
  since: Date
): Promise<ProjectItem[]> {
  const allItems: ProjectItem[] = [];
  let page = 1;
  const perPage = 100;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      // Search for issues with the specific label in the organization
      const { data: searchResult } = await octokit.rest.search.issuesAndPullRequests({
        q: `org:${org} label:"area: devrel-opensource" type:issue created:>=${since.toISOString().split('T')[0]}`,
        per_page: perPage,
        page: page,
      });

      if (searchResult.items.length === 0) {
        hasNextPage = false;
        break;
      }

      for (const issue of searchResult.items) {
        const projectItem: ProjectItem = {
          id: issue.id.toString(),
          content: {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body || '',
            state: issue.state as 'open' | 'closed',
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            closed_at: issue.closed_at,
            html_url: issue.html_url,
            user: {
              login: issue.user?.login || '',
              avatar_url: issue.user?.avatar_url || '',
            },
            labels: issue.labels.map((label: any) => ({
              id: label.id,
              name: label.name,
              color: label.color,
              description: label.description,
            })),
            assignees: issue.assignees?.map((assignee: any) => ({
              login: assignee.login,
              avatar_url: assignee.avatar_url,
            })) || [],
            milestone: issue.milestone ? {
              title: issue.milestone.title,
              description: issue.milestone.description,
              due_on: issue.milestone.due_on,
            } : null,
          },
          fieldValues: {
            nodes: [],
          },
        };

        allItems.push(projectItem);
      }

      page++;
      hasNextPage = searchResult.items.length === perPage;
    } catch (searchError) {
      console.error('Error searching issues:', searchError);
      break;
    }
  }

  return allItems;
}

export function transformToCalendarEvents(items: ProjectItem[]): CalendarEvent[] {
  return items.map((item) => {
    const issue = item.content;
    
    // Debug: Log all field values to see what custom fields are available
    console.log(`🔍 Issue #${issue.number} field values:`, item.fieldValues.nodes.map(fv => ({
      fieldName: fv.field.name,
      date: fv.date,
      text: fv.text,
      name: fv.name,
      number: fv.number
    })));
    
    // Extract start and end dates from field values
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    item.fieldValues.nodes.forEach((fieldValue) => {
      const fieldName = fieldValue.field.name.toLowerCase();
      
      if (fieldName.includes('start') && fieldValue.date) {
        startDate = new Date(fieldValue.date);
        console.log(`📅 Found start date from field "${fieldValue.field.name}":`, startDate);
      } else if ((fieldName.includes('end') || fieldName.includes('due')) && fieldValue.date) {
        endDate = new Date(fieldValue.date);
        console.log(`📅 Found end date from field "${fieldValue.field.name}":`, endDate);
      }
    });

    // Try to extract dates from issue body if not found in field values
    if (!startDate || !endDate) {
      const body = issue.body || '';
      
      // Look for date patterns in the issue body
      const startDateMatch = body.match(/\*\*Start Date:\*\*.*?\(([^)]+)\)/);
      const endDateMatch = body.match(/\*\*End Date:\*\*.*?\(([^)]+)\)/);
      
      if (startDateMatch && !startDate) {
        startDate = new Date(startDateMatch[1]);
        console.log(`📅 Found start date from body:`, startDate);
      }
      
      if (endDateMatch && !endDate) {
        endDate = new Date(endDateMatch[1]);
        console.log(`📅 Found end date from body:`, endDate);
      }
    }

    // If no start date from fields or body, use created date
    if (!startDate) {
      startDate = new Date(issue.created_at);
      console.log(`📅 Using created date as start date:`, startDate);
    }

    // If issue has a milestone with due date, use that as end date
    if (!endDate && issue.milestone?.due_on) {
      endDate = new Date(issue.milestone.due_on);
      console.log(`📅 Using milestone due date as end date:`, endDate);
    }

    return {
      id: `${issue.number}`, // Use issue number as ID for easier API updates
      title: issue.title,
      startDate,
      endDate,
      url: issue.html_url,
      labels: issue.labels.map((label) => ({
        name: label.name,
        color: `#${label.color}`,
      })),
      assignees: issue.assignees.map((assignee) => ({
        login: assignee.login,
        avatar_url: assignee.avatar_url,
      })),
      status: issue.state,
      type: 'issue' as const,
    };
  }).filter((event) => event.startDate); // Only include events with start dates
}

export async function getCalendarEvents(
  org: string = 'squareup',
  projectNumber: number = 333,
  sinceDate?: Date
): Promise<CalendarEvent[]> {
  const items = await fetchProjectItems(org, projectNumber, sinceDate);
  return transformToCalendarEvents(items);
}
