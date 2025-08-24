import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const PROJECT_ID = 'PVT_kwDOAvK6Ls4A3QG5'; // Developer Programs project
const START_DATE_FIELD_ID = 'PVTF_lADOAvK6Ls4A3QG5zgzyZP8';
const DUE_DATE_FIELD_ID = 'PVTF_lADOAvK6Ls4A3QG5zgvSg3Q';

// GraphQL mutation to update project item field values
const UPDATE_PROJECT_ITEM_FIELD_VALUE = `
  mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: $value
    }) {
      projectV2Item {
        id
      }
    }
  }
`;

// GraphQL query to get project item ID for an issue
const GET_PROJECT_ITEM_ID = `
  query($projectId: ID!, $issueNumber: Int!, $org: String!, $repo: String!) {
    organization(login: $org) {
      projectV2(number: 333) {
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue {
                number
                repository {
                  name
                  owner {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueNumber, startDate, endDate } = body;

    console.log('🔧 Project fields PATCH request:', { issueNumber, startDate, endDate });

    if (!issueNumber) {
      return NextResponse.json(
        { error: 'Issue number is required' },
        { status: 400 }
      );
    }

    // First, find the project item ID for this issue
    const projectItemResponse: any = await octokit.graphql(GET_PROJECT_ITEM_ID, {
      projectId: PROJECT_ID,
      issueNumber: parseInt(issueNumber),
      org: 'squareup',
      repo: 'developer-programs'
    });

    const projectItems = projectItemResponse.organization.projectV2.items.nodes;
    const projectItem = projectItems.find((item: any) => 
      item.content?.number === parseInt(issueNumber) &&
      item.content?.repository?.name === 'developer-programs' &&
      item.content?.repository?.owner?.login === 'squareup'
    );

    if (!projectItem) {
      return NextResponse.json(
        { error: `Project item not found for issue #${issueNumber}` },
        { status: 404 }
      );
    }

    console.log('📋 Found project item ID:', projectItem.id);

    const updates = [];

    // Update start date if provided
    if (startDate) {
      const startDateISO = new Date(startDate).toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('📅 Updating start date to:', startDateISO);
      
      const startDateUpdate = await octokit.graphql(UPDATE_PROJECT_ITEM_FIELD_VALUE, {
        projectId: PROJECT_ID,
        itemId: projectItem.id,
        fieldId: START_DATE_FIELD_ID,
        value: { date: startDateISO }
      });
      updates.push({ field: 'Start Date', value: startDateISO });
    }

    // Update due date if provided
    if (endDate) {
      const endDateISO = new Date(endDate).toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('📅 Updating due date to:', endDateISO);
      
      const dueDateUpdate = await octokit.graphql(UPDATE_PROJECT_ITEM_FIELD_VALUE, {
        projectId: PROJECT_ID,
        itemId: projectItem.id,
        fieldId: DUE_DATE_FIELD_ID,
        value: { date: endDateISO }
      });
      updates.push({ field: 'Due Date', value: endDateISO });
    }

    console.log('✅ Project fields updated successfully:', updates);

    return NextResponse.json({
      success: true,
      updates,
      projectItemId: projectItem.id
    });

  } catch (error) {
    console.error('❌ Error updating project fields:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update project fields: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update project fields' },
      { status: 500 }
    );
  }
}
