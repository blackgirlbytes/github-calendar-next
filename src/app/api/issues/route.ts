import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = 'squareup'; // Organization name
const REPO = 'developer-programs'; // Repository name

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, labels, assignees, startDate, endDate } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create the issue body with date information
    let issueBody = '';
    if (startDate) {
      issueBody += `**Start Date:** ${new Date(startDate).toLocaleDateString()}\n`;
    }
    if (endDate) {
      issueBody += `**End Date:** ${new Date(endDate).toLocaleDateString()}\n`;
    }
    if (startDate || endDate) {
      issueBody += '\n---\n\n';
    }

    // Create the issue
    const issue = await octokit.rest.issues.create({
      owner: OWNER,
      repo: REPO,
      title,
      body: issueBody,
      labels: labels?.map((label: any) => label.name) || [],
      assignees: assignees?.map((assignee: any) => assignee.login) || [],
    });

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.data.id.toString(),
        number: issue.data.number,
        title: issue.data.title,
        url: issue.data.html_url,
        status: issue.data.state as 'open' | 'closed',
      }
    });

  } catch (error) {
    console.error('Error creating issue:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create issue: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, labels, assignees, status, startDate, endDate } = body;

    console.log('🔧 PATCH request received:', { id, title, startDate, endDate, labels, assignees, status });

    if (!id) {
      return NextResponse.json(
        { error: 'Issue ID is required' },
        { status: 400 }
      );
    }

    // The ID should be the issue number directly (as stored in our calendar events)
    const issueNumber = parseInt(id.toString());

    if (!issueNumber || isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number format' },
        { status: 400 }
      );
    }

    // First, get the current issue to preserve existing body content
    const currentIssue = await octokit.rest.issues.get({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNumber
    });

    // Update the issue body with new date information
    let issueBody = currentIssue.data.body || '';
    
    // Remove existing date information if present
    issueBody = issueBody.replace(/\*\*Start Date:\*\*.*\n?/g, '');
    issueBody = issueBody.replace(/\*\*End Date:\*\*.*\n?/g, '');
    issueBody = issueBody.replace(/^---\n\n/gm, '');

    // Add new date information at the top with ISO format for better parsing
    let dateInfo = '';
    if (startDate) {
      const startDateObj = new Date(startDate);
      dateInfo += `**Start Date:** ${startDateObj.toLocaleDateString()} (${startDateObj.toISOString()})\n`;
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      dateInfo += `**End Date:** ${endDateObj.toLocaleDateString()} (${endDateObj.toISOString()})\n`;
    }
    if (dateInfo) {
      dateInfo += '\n---\n\n';
      issueBody = dateInfo + issueBody;
    }

    console.log('📝 Updated issue body:', issueBody.substring(0, 200) + '...');

    // Update the issue
    const updateData: any = {};
    if (title) updateData.title = title;
    if (labels) updateData.labels = labels.map((label: any) => label.name);
    if (assignees) updateData.assignees = assignees.map((assignee: any) => assignee.login);
    if (status) updateData.state = status;
    updateData.body = issueBody;

    const issue = await octokit.rest.issues.update({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNumber,
      ...updateData
    });

    console.log('✅ Issue updated successfully:', issue.data.number);

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.data.id.toString(),
        number: issue.data.number,
        title: issue.data.title,
        url: issue.data.html_url,
        status: issue.data.state as 'open' | 'closed',
        startDate: startDate || null,
        endDate: endDate || null,
      }
    });

  } catch (error) {
    console.error('Error updating issue:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update issue: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}
