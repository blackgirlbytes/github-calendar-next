'use client';

import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Calendar as CalendarIcon, User, Tag } from 'lucide-react';
import { CalendarEvent } from '@/types/github';

interface EventDetailsProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.status}
                </span>
                <span className="capitalize">{event.type}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Dates */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-medium">Timeline</span>
            </div>
            <div className="ml-6 space-y-1">
              <div>
                <span className="font-medium">Start:</span> {format(event.startDate, 'PPP')}
              </div>
              {event.endDate && (
                <div>
                  <span className="font-medium">End:</span> {format(event.endDate, 'PPP')}
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          {event.labels.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Tag className="w-4 h-4" />
                <span className="font-medium">Labels</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-2">
                {event.labels.map((label, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assignees */}
          {event.assignees.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">Assignees</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-3">
                {event.assignees.map((assignee, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assignee.avatar_url}
                      alt={assignee.login}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-700">{assignee.login}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
