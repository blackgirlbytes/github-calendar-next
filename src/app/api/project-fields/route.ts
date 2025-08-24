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
  query($org: String!, $repo: String!, $issueNumber: Int!) {
    repository(owner: $org, name: $repo) {
      issue(number: $issueNumber) {
        id
        number
        title
        projectItems(first: 10) {
          nodes {
            id
            project {
              id
              title
              number
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
      console.error('❌ Missing issue number');
      return NextResponse.json(
        { error: 'Issue number is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking for project item for issue #', issueNumber);

    // First, find the project item ID for this issue
    try {
      const projectItemResponse: any = await octokit.graphql(GET_PROJECT_ITEM_ID, {
        issueNumber: parseInt(issueNumber),
        org: 'squareup',
        repo: 'developer-programs'
      });

      console.log('📋 GraphQL response for project items:', JSON.stringify(projectItemResponse, null, 2));

      const issue = projectItemResponse.repository.issue;
      if (!issue) {
        console.error('❌ Issue not found:', issueNumber);
        return NextResponse.json(
          { error: `Issue #${issueNumber} not found` },
          { status: 404 }
        );
      }

      const projectItems = issue.projectItems.nodes;
      console.log('📋 Found project items for issue:', projectItems.length);

      // Find the project item for project 333 (Developer Programs)
      const projectItem = projectItems.find((item: any) => 
        item.project.number === 333
      );

      if (!projectItem) {
        console.error('❌ Project item not found for issue #', issueNumber, 'in project 333');
        console.log('Available project items:', projectItems.map(item => ({
          projectId: item.project.id,
          projectNumber: item.project.number,
          projectTitle: item.project.title
        })));
        return NextResponse.json(
          { error: `Issue #${issueNumber} is not in project 333 (Developer Programs)` },
          { status: 404 }
        );
      }

      console.log('📋 Found project item ID:', projectItem.id);

      const updates = [];

      // Update start date if provided
      if (startDate) {
        try {
          const startDateISO = new Date(startDate).toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('📅 Updating start date to:', startDateISO);
          
          const startDateUpdate = await octokit.graphql(UPDATE_PROJECT_ITEM_FIELD_VALUE, {
            projectId: PROJECT_ID,
            itemId: projectItem.id,
            fieldId: START_DATE_FIELD_ID,
            value: { date: startDateISO }
          });
          console.log('✅ Start date update response:', startDateUpdate);
          updates.push({ field: 'Start Date', value: startDateISO });
        } catch (startDateError) {
          console.error('❌ Error updating start date:', startDateError);
          throw startDateError;
        }
      }

      // Update due date if provided
      if (endDate) {
        try {
          const endDateISO = new Date(endDate).toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('📅 Updating due date to:', endDateISO);
          
          const dueDateUpdate = await octokit.graphql(UPDATE_PROJECT_ITEM_FIELD_VALUE, {
            projectId: PROJECT_ID,
            itemId: projectItem.id,
            fieldId: DUE_DATE_FIELD_ID,
            value: { date: endDateISO }
          });
          console.log('✅ Due date update response:', dueDateUpdate);
          updates.push({ field: 'Due Date', value: endDateISO });
        } catch (dueDateError) {
          console.error('❌ Error updating due date:', dueDateError);
          throw dueDateError;
        }
      }

      console.log('✅ Project fields updated successfully:', updates);

      return NextResponse.json({
        success: true,
        updates,
        projectItemId: projectItem.id
      });

    } catch (graphqlError) {
      console.error('❌ GraphQL error:', graphqlError);
      throw graphqlError;
    }

  } catch (error) {
    console.error('❌ Error updating project fields:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update project fields: ${error.message}`, details: error.stack },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update project fields', details: 'Unknown error' },
      { status: 500 }
    );
  }
}
