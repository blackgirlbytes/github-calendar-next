'use client';

import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent } from '@/types/github';

interface FullCalendarComponentProps {
  events: CalendarEvent[];
  loading?: boolean;
  selectedAssignees?: string[];
}

const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({ 
  events, 
  loading = false,
  selectedAssignees = []
}) => {
  // Color palette for assignees
  const assigneeColors = [
    { bg: '#3b82f6', border: '#1d4ed8' }, // Blue
    { bg: '#10b981', border: '#047857' }, // Green
    { bg: '#f59e0b', border: '#d97706' }, // Amber
    { bg: '#ef4444', border: '#dc2626' }, // Red
    { bg: '#8b5cf6', border: '#7c3aed' }, // Purple
    { bg: '#06b6d4', border: '#0891b2' }, // Cyan
    { bg: '#ec4899', border: '#db2777' }, // Pink
    { bg: '#84cc16', border: '#65a30d' }, // Lime
    { bg: '#f97316', border: '#ea580c' }, // Orange
    { bg: '#6366f1', border: '#4f46e5' }, // Indigo
  ];

  // Create a consistent color mapping for assignees
  const assigneeColorMap = useMemo(() => {
    const uniqueAssignees = Array.from(
      new Set(
        events.flatMap(event => 
          event.assignees?.map(assignee => assignee.login) || []
        )
      )
    );
    
    const colorMap: Record<string, { bg: string; border: string }> = {};
    uniqueAssignees.forEach((login, index) => {
      colorMap[login] = assigneeColors[index % assigneeColors.length];
    });
    
    return colorMap;
  }, [events]);

  // Get color for an event based on its assignees
  const getEventColor = (assignees: Array<{ login: string; avatar_url: string }>) => {
    if (!assignees || assignees.length === 0) {
      return { bg: '#6b7280', border: '#4b5563' }; // Gray for unassigned
    }
    
    // Use the first assignee's color if multiple assignees
    const primaryAssignee = assignees[0];
    return assigneeColorMap[primaryAssignee.login] || { bg: '#6b7280', border: '#4b5563' };
  };

  // Filter events based on selected assignees
  const filteredEvents = useMemo(() => {
    if (selectedAssignees.length === 0) {
      return events;
    }

    return events.filter(event => {
      // Handle unassigned filter
      if (selectedAssignees.includes('unassigned')) {
        if (!event.assignees || event.assignees.length === 0) {
          return true;
        }
      }

      // Handle assigned users filter
      if (event.assignees && event.assignees.length > 0) {
        return event.assignees.some(assignee => 
          selectedAssignees.includes(assignee.login)
        );
      }

      return false;
    });
  }, [events, selectedAssignees]);

  // Transform GitHub events to FullCalendar event format
  const calendarEvents = useMemo(() => {
    const events = filteredEvents.map(event => {
      const colors = getEventColor(event.assignees || []);
      
      // Handle events without end dates
      let eventEnd = event.endDate;
      if (!eventEnd) {
        // For events without end dates, make them single-day events
        // by not setting an end date (FullCalendar will treat as single day)
        eventEnd = undefined;
      }
      
      // Get primary assignee for sorting (first assignee or 'unassigned')
      const primaryAssignee = event.assignees && event.assignees.length > 0 
        ? event.assignees[0].login.toLowerCase()
        : 'zzz-unassigned'; // Put unassigned at the end
      
      // Check if issue is completed
      const isCompleted = event.status === 'closed';
      
      // Adjust colors for completed issues (make them duller)
      const eventColors = isCompleted ? {
        bg: colors.bg + '80', // Add transparency (50% opacity)
        border: colors.border + '80'
      } : colors;
      
      return {
        id: eventEnd ? event.id : `${event.id}-single`, // Use original ID for spanned events, unique ID for single events
        title: event.title,
        start: event.startDate,
        end: eventEnd,
        allDay: !eventEnd, // Mark as all-day only if no end date
        url: event.url,
        backgroundColor: eventColors.bg,
        borderColor: eventColors.border,
        textColor: isCompleted ? '#ffffff80' : '#ffffff', // Duller text for completed
        extendedProps: {
          labels: event.labels || [],
          assignees: event.assignees || [],
          status: event.status,
          repository: event.url?.split('/').slice(3, 5).join('/'),
          primaryAssignee: primaryAssignee,
          isCompleted: isCompleted,
          originalId: event.id // Keep original ID for reference
        }
      };
    });

    // Sort events alphabetically by primary assignee and add order property
    const sortedEvents = events
      .sort((a, b) => {
        const assigneeA = a.extendedProps.primaryAssignee;
        const assigneeB = b.extendedProps.primaryAssignee;
        return assigneeA.localeCompare(assigneeB);
      })
      .map((event, index) => ({
        ...event,
        order: index // Force FullCalendar to respect our sorting
      }));

    // Debug logging for August 2nd events
    const aug2Events = sortedEvents.filter(event => 
      event.start && new Date(event.start).toDateString() === new Date('2025-08-02').toDateString()
    );
    if (aug2Events.length > 0) {
      console.log('August 2nd events in order:', aug2Events.map(e => ({
        title: e.title,
        assignee: e.extendedProps.primaryAssignee,
        assignees: e.extendedProps.assignees?.map((a: any) => a.login),
        order: e.order
      })));
    }

    return sortedEvents;
  }, [filteredEvents, assigneeColorMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth'
        }}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={6} // Show max 6 events per day, then "+X more"
        moreLinkClick="popover" // Show popover when clicking "+X more"
        eventOrder="order" // Use our custom order property for sorting
        
        // Event styling and interaction
        eventClick={(info) => {
          // Open GitHub issue in new tab
          if (info.event.url) {
            window.open(info.event.url, '_blank');
          }
          info.jsEvent.preventDefault(); // Prevent default link behavior
        }}
        
        // Custom event content rendering
        eventContent={(eventInfo) => {
          const { event } = eventInfo;
          const assignees = event.extendedProps.assignees || [];
          const isCompleted = event.extendedProps.isCompleted;
          
          return (
            <div className="flex items-center gap-1 p-1 text-xs">
              {/* Completion checkmark */}
              {isCompleted && (
                <div className="flex-shrink-0">
                  <svg 
                    className="w-3 h-3 text-white/80" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    title="Completed"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              )}
              
              {/* Avatar(s) */}
              <div className="flex -space-x-1 flex-shrink-0">
                {assignees.length > 0 ? (
                  assignees.slice(0, 2).map((assignee: any, index: number) => (
                    <img
                      key={assignee.login}
                      src={assignee.avatar_url}
                      alt={assignee.login}
                      className={`w-4 h-4 rounded-full border border-white/50 bg-white ${isCompleted ? 'opacity-70' : ''}`}
                      title={assignee.login}
                      style={{ zIndex: 10 - index }}
                    />
                  ))
                ) : (
                  <div 
                    className={`w-4 h-4 rounded-full border border-white/50 bg-gray-400 flex items-center justify-center ${isCompleted ? 'opacity-70' : ''}`}
                    title="Unassigned"
                  >
                    <span className="text-[8px] text-white font-bold">?</span>
                  </div>
                )}
                {assignees.length > 2 && (
                  <div 
                    className={`w-4 h-4 rounded-full border border-white/50 bg-gray-600 flex items-center justify-center ${isCompleted ? 'opacity-70' : ''}`}
                    title={`+${assignees.length - 2} more assignees`}
                  >
                    <span className="text-[8px] text-white font-bold">+{assignees.length - 2}</span>
                  </div>
                )}
              </div>
              
              {/* Title */}
              <div className={`font-medium truncate flex-1 min-w-0 ${isCompleted ? 'line-through opacity-80' : ''}`} title={event.title}>
                {event.title}
              </div>
            </div>
          );
        }}
        
        // Date range - only show from August 2025 onwards
        validRange={{
          start: '2025-08-01'
        }}
        
        // Initial date - start at August 2025
        initialDate="2025-08-01"
        
        // Styling
        themeSystem="standard"
        
        // Custom CSS classes
        eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
        
        // Weekend styling
        weekends={true}
        
        // Show week numbers
        weekNumbers={false}
        
        // First day of week (0 = Sunday, 1 = Monday)
        firstDay={0}
      />
    </div>
  );
};

export default FullCalendarComponent;
