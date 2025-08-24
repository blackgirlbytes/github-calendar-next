import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org') || 'squareup';
    const projectNumber = parseInt(searchParams.get('project') || '333');
    const since = searchParams.get('since');

    let sinceDate: Date | undefined;
    if (since) {
      sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid since date format' },
          { status: 400 }
        );
      }
    }

    const events = await getCalendarEvents(org, projectNumber, sinceDate);
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json(
        { error: 'GitHub authentication failed. Please check your GITHUB_TOKEN.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
