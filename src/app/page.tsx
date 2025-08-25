'use client';

import React, { useState, useEffect } from 'react';
import FullCalendarComponent from '@/components/FullCalendarComponent';
import AssigneeFilter from '@/components/AssigneeFilter';
import EventDetails from '@/components/EventDetails';
import ThemeToggle from '@/components/ThemeToggle';
import { CalendarEvent } from '@/types/github';
import { Github, AlertCircle } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

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

  const refreshEvents = async () => {
    await fetchEvents();
  };

  useEffect(() => {
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
    console.log('🔄 handleEventUpdate called with:', eventData);
    
    try {
      // Update the issue (title, labels, assignees, etc.)
      console.log('📡 Making PATCH request to /api/issues');
      const issueResponse = await fetch('/api/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      console.log('📡 Issue response status:', issueResponse.status);

      if (!issueResponse.ok) {
        const errorData = await issueResponse.json();
        console.error('❌ Issue API error response:', errorData);
        throw new Error(errorData.error || 'Failed to update issue');
      }

      const issueResult = await issueResponse.json();
      console.log('✅ Issue updated successfully:', issueResult);

      // Update project custom fields (dates)
      if (eventData.startDate || eventData.endDate) {
        console.log('📅 Making PATCH request to /api/project-fields for dates');
        const fieldsResponse = await fetch('/api/project-fields', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            issueNumber: eventData.id,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
          }),
        });

        console.log('📅 Project fields response status:', fieldsResponse.status);

        if (!fieldsResponse.ok) {
          const errorData = await fieldsResponse.json();
          console.error('❌ Project fields API error response:', errorData);
          // Don't throw here - issue update succeeded, just log the field update failure
          console.warn('⚠️ Project fields update failed, but issue was updated successfully');
        } else {
          const fieldsResult = await fieldsResponse.json();
          console.log('✅ Project fields updated successfully:', fieldsResult);
        }
      }
      
      // Refresh events from GitHub to ensure consistency
      console.log('🔄 Refreshing events...');
      await refreshEvents();
      console.log('✅ Events refreshed');
      
    } catch (error) {
      console.error('❌ Error updating issue:', error);
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
      console.log('Issue created successfully:', result);
      
      // Refresh events from GitHub to ensure consistency
      await refreshEvents();
      
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 dark:bg-gray-900/80 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Github className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-300">
                  GitHub Project Calendar
                </h1>
                <p className="text-sm text-gray-600 font-medium dark:text-gray-400">
                  DevRel Open Source Issues • Square Organization
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Events</h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                {error.includes('authentication') && (
                  <div className="mt-3 text-sm text-red-600 dark:text-red-400">
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Events</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {loading ? '...' : events.length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                    <Github className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Open Issues</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      {loading ? '...' : events.filter(e => e.status === 'open').length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Closed Issues</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                      {loading ? '...' : events.filter(e => e.status === 'closed').length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-700/30 dark:to-slate-700/30 rounded-xl">
                    <Github className="w-8 h-8 text-gray-600 dark:text-gray-400" />
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
