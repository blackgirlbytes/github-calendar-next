'use client';

import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent } from '@/types/github';

interface FullCalendarComponentProps {
  events: CalendarEvent[];
  loading?: boolean;
}

const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({ 
  events, 
  loading = false 
}) => {
  // Transform GitHub events to FullCalendar event format
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startDate,
      end: event.endDate || event.startDate, // Use startDate as end if no endDate
      url: event.url,
      backgroundColor: '#3b82f6', // Blue color for GitHub issues
      borderColor: '#1d4ed8',
      textColor: '#ffffff',
      extendedProps: {
        labels: event.labels || [],
        assignees: event.assignees,
        status: event.status,
        repository: event.url?.split('/').slice(3, 5).join('/')
      }
    }));
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
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
        dayMaxEvents={3} // Show max 3 events per day, then "+X more"
        moreLinkClick="popover" // Show popover when clicking "+X more"
        
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
          const labels = event.extendedProps.labels || [];
          
          return (
            <div className="p-1 text-xs">
              <div className="font-medium truncate" title={event.title}>
                {event.title}
              </div>
              {labels.length > 0 && (
                <div className="text-xs opacity-75 truncate">
                  {labels.slice(0, 2).map((label: any) => label.name).join(', ')}
                  {labels.length > 2 && '...'}
                </div>
              )}
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
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>GitHub Issues ({events.length} total)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
          <span>Click events to view on GitHub</span>
        </div>
      </div>
    </div>
  );
};

export default FullCalendarComponent;
