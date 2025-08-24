'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { CalendarEvent } from '@/types/github';

interface CalendarProps {
  events: CalendarEvent[];
  loading?: boolean;
}

interface EventPosition {
  event: CalendarEvent;
  left: number;
  width: number;
  top: number;
  zIndex: number;
}

const Calendar: React.FC<CalendarProps> = ({ events, loading = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventPositions, setEventPositions] = useState<EventPosition[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      
      return day >= eventStart && day <= eventEnd;
    });
  };

  const calculateEventPositions = useCallback(() => {
    if (!calendarRef.current) return;

    const calendarRect = calendarRef.current.getBoundingClientRect();
    const dayWidth = calendarRect.width / 7; // 7 days per week
    const positions: EventPosition[] = [];

    // Group events by week rows
    const weekRows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weekRows.push(days.slice(i, i + 7));
    }

    events.forEach((event, eventIndex) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;

      // Find which week row(s) this event spans
      weekRows.forEach((week, weekIndex) => {
        const weekStart = week[0];
        const weekEnd = week[6];

        // Check if event intersects with this week
        if (eventEnd >= weekStart && eventStart <= weekEnd) {
          // Calculate start and end positions within this week
          const startDayInWeek = Math.max(0, Math.floor((eventStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
          const endDayInWeek = Math.min(6, Math.floor((eventEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));

          const left = startDayInWeek * dayWidth;
          const width = (endDayInWeek - startDayInWeek + 1) * dayWidth - 4; // Subtract margin
          const top = weekIndex * 120 + 60 + (eventIndex % 3) * 24; // Offset for multiple events
          
          positions.push({
            event,
            left,
            width,
            top,
            zIndex: 10 + eventIndex,
          });
        }
      });
    });

    setEventPositions(positions);
  }, [events, days]);

  useEffect(() => {
    calculateEventPositions();
  }, [events, currentDate]); // Removed calculateEventPositions from dependencies to prevent infinite loop

  useEffect(() => {
    const handleResize = () => calculateEventPositions();
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateEventPositions]); // Separate effect for resize listener

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="relative">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] p-2 border border-gray-200 relative
                  ${!isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : 'bg-white'}
                  ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                `}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                {/* Simple event indicators for days with events */}
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event, index) => (
                      <div
                        key={`${event.id}-${index}`}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Spanning Event Bars */}
        {eventPositions.map((position, index) => (
          <div
            key={`${position.event.id}-${index}`}
            className="absolute bg-blue-500 text-white text-xs p-1 rounded shadow-sm cursor-pointer hover:bg-blue-600 transition-colors"
            style={{
              left: `${position.left}px`,
              width: `${position.width}px`,
              top: `${position.top}px`,
              zIndex: position.zIndex,
            }}
            onClick={() => window.open(position.event.url, '_blank')}
            title={`${position.event.title} - Click to view on GitHub`}
          >
            <div className="flex items-center space-x-1 truncate">
              <span className="truncate">{position.event.title}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>GitHub Issues</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
