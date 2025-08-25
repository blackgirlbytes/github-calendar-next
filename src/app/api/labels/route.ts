import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = 'squareup'; // Organization name
const REPO = 'developer-programs'; // Repository name

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching repository labels...');

    // Get all labels for the repository
    const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
      owner: OWNER,
      repo: REPO,
      per_page: 100, // Get up to 100 labels
    });

    console.log(`✅ Found ${labels.length} repository labels`);

    // Transform labels to our format
    const transformedLabels = labels.map(label => ({
      name: label.name,
      color: `#${label.color}`,
      description: label.description || '',
    }));

    return NextResponse.json({
      labels: transformedLabels,
      count: transformedLabels.length,
    });

  } catch (error) {
    console.error('❌ Error fetching repository labels:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = (error as any)?.status || 500;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch repository labels',
        details: errorMessage 
      },
      { status: statusCode }
    );
  }
}
