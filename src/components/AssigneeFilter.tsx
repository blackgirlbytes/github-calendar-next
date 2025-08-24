'use client';

import React, { useMemo } from 'react';
import { CalendarEvent } from '@/types/github';
import { X } from 'lucide-react';

interface AssigneeFilterProps {
  events: CalendarEvent[];
  selectedAssignees: string[];
  onAssigneeToggle: (login: string) => void;
  onClearFilters: () => void;
}

const AssigneeFilter: React.FC<AssigneeFilterProps> = ({
  events,
  selectedAssignees,
  onAssigneeToggle,
  onClearFilters
}) => {
  // Color palette matching FullCalendarComponent
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

  // Get unique assignees with their event counts and colors
  const assigneeStats = useMemo(() => {
    const assigneeMap = new Map<string, {
      login: string;
      avatar_url: string;
      count: number;
      color: { bg: string; border: string };
    }>();

    // Count unassigned issues
    let unassignedCount = 0;

    events.forEach(event => {
      if (!event.assignees || event.assignees.length === 0) {
        unassignedCount++;
      } else {
        event.assignees.forEach(assignee => {
          const existing = assigneeMap.get(assignee.login);
          if (existing) {
            existing.count++;
          } else {
            assigneeMap.set(assignee.login, {
              login: assignee.login,
              avatar_url: assignee.avatar_url,
              count: 1,
              color: assigneeColors[assigneeMap.size % assigneeColors.length]
            });
          }
        });
      }
    });

    const assignees = Array.from(assigneeMap.values()).sort((a, b) => b.count - a.count);
    
    // Add unassigned if there are any
    if (unassignedCount > 0) {
      assignees.push({
        login: 'unassigned',
        avatar_url: '',
        count: unassignedCount,
        color: { bg: '#6b7280', border: '#4b5563' }
      });
    }

    return assignees;
  }, [events]);

  const hasActiveFilters = selectedAssignees.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filter by Assignee</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {assigneeStats.map(assignee => {
          const isSelected = selectedAssignees.includes(assignee.login);
          const isUnassigned = assignee.login === 'unassigned';
          
          return (
            <button
              key={assignee.login}
              onClick={() => onAssigneeToggle(assignee.login)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Avatar or Unassigned Icon */}
              <div className="flex-shrink-0">
                {isUnassigned ? (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: assignee.color.bg }}
                  >
                    ?
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={assignee.avatar_url}
                      alt={assignee.login}
                      className="w-8 h-8 rounded-full border-2"
                      style={{ borderColor: assignee.color.bg }}
                    />
                    {/* Color indicator dot */}
                    <div 
                      className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: assignee.color.bg }}
                    />
                  </div>
                )}
              </div>

              {/* Name and Count */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {isUnassigned ? 'Unassigned' : assignee.login}
                </div>
                <div className="text-sm text-gray-500">
                  {assignee.count} issue{assignee.count !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing issues for: {' '}
            <span className="font-medium">
              {selectedAssignees.map(login => 
                login === 'unassigned' ? 'Unassigned' : login
              ).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssigneeFilter;
