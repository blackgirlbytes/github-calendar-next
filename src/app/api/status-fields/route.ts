import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const PROJECT_ID = 'PVT_kwDOAvK6Ls4A3QG5'; // Developer Programs project

// GraphQL query to get project status field configuration
const GET_PROJECT_STATUS_FIELDS = `
  query($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        id
        title
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching project status fields...');

    // Get project fields configuration
    const response: any = await octokit.graphql(GET_PROJECT_STATUS_FIELDS, {
      projectId: PROJECT_ID,
    });

    const project = response.node;
    if (!project) {
      throw new Error(`Project not found with ID: ${PROJECT_ID}`);
    }

    // Find status-related fields (typically named "Status", "State", etc.)
    const statusFields = project.fields.nodes.filter((field: any) => {
      const fieldName = field.name.toLowerCase();
      return fieldName.includes('status') || 
             fieldName.includes('state') || 
             fieldName.includes('progress') ||
             fieldName === 'status'; // Exact match for common field name
    });

    console.log(`✅ Found ${statusFields.length} status fields`);

    // Transform to our format
    const transformedFields = statusFields.map((field: any) => ({
      id: field.id,
      name: field.name,
      options: field.options.map((option: any) => ({
        id: option.id,
        name: option.name,
        color: option.color || '#6b7280', // Default gray if no color
      })),
    }));

    return NextResponse.json({
      statusFields: transformedFields,
      count: transformedFields.length,
    });

  } catch (error) {
    console.error('❌ Error fetching project status fields:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = (error as any)?.status || 500;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch project status fields',
        details: errorMessage 
      },
      { status: statusCode }
    );
  }
}
