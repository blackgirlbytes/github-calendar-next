'use client';

import React, { useState, useEffect } from 'react';
import FullCalendarComponent from '@/components/FullCalendarComponent';
import AssigneeFilter from '@/components/AssigneeFilter';
import EventDetails from '@/components/EventDetails';
import { CalendarEvent } from '@/types/github';
import { Github, AlertCircle } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch events from August 2025 onwards
        const since = new Date('2025-08-01').toISOString();
        const response = await fetch(`/api/events?since=${since}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAssigneeToggle = (login: string) => {
    setSelectedAssignees(prev => {
      if (prev.includes(login)) {
        return prev.filter(l => l !== login);
      } else {
        return [...prev, login];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedAssignees([]);
  };

  const handleEventUpdate = async (eventData: Partial<CalendarEvent>) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update issue');
      }

      const result = await response.json();
      
      // Update local state with the updated event
      setEvents(prev => prev.map(event => 
        event.id === eventData.id ? { ...event, ...eventData } : event
      ));

      console.log('Issue updated successfully:', result);
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleEventCreate = async (eventData: Partial<CalendarEvent>) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create issue');
      }

      const result = await response.json();
      
      // Create new event with the actual GitHub issue data
      const newEvent: CalendarEvent = {
        id: result.issue.id,
        title: result.issue.title,
        startDate: eventData.startDate || new Date(),
        endDate: eventData.endDate || null,
        url: result.issue.url,
        labels: eventData.labels || [],
        assignees: eventData.assignees || [],
        status: result.issue.status,
        type: 'issue'
      };
      
      setEvents(prev => [...prev, newEvent]);
      console.log('Issue created successfully:', result);
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Github className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  GitHub Project Calendar
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  DevRel Open Source Issues • Square Organization
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Events</h3>
                <p className="text-red-700 mt-1">{error}</p>
                {error.includes('authentication') && (
                  <div className="mt-3 text-sm text-red-600">
                    <p>Make sure you have set the GITHUB_TOKEN environment variable.</p>
                    <p>You can create a personal access token at: <a href="https://github.com/settings/tokens" className="underline" target="_blank" rel="noopener noreferrer">https://github.com/settings/tokens</a></p>
                  </div>
                )}
                <button
                  onClick={handleRefresh}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Events</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {loading ? '...' : events.length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <Github className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Open Issues</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      {loading ? '...' : events.filter(e => e.status === 'open').length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Closed Issues</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                      {loading ? '...' : events.filter(e => e.status === 'closed').length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-gray-100 to-slate-100 rounded-xl">
                    <Github className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Assignee Filter */}
            <AssigneeFilter
              events={events}
              selectedAssignees={selectedAssignees}
              onAssigneeToggle={handleAssigneeToggle}
              onClearFilters={handleClearFilters}
            />

            {/* Calendar */}
            <FullCalendarComponent 
              events={events} 
              loading={loading}
              selectedAssignees={selectedAssignees}
              onEventUpdate={handleEventUpdate}
              onEventCreate={handleEventCreate}
            />
          </>
        )}
      </main>

      {/* Event Details Modal */}
      <EventDetails
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
