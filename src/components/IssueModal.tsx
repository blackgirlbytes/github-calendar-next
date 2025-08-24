'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ExternalLink, 
  Calendar as CalendarIcon, 
  User, 
  Tag, 
  Save, 
  Plus,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { CalendarEvent } from '@/types/github';

interface IssueModalProps {
  event?: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>) => Promise<void>;
  mode: 'view' | 'edit' | 'create';
  selectedDate?: Date;
}

const IssueModal: React.FC<IssueModalProps> = ({ 
  event, 
  isOpen, 
  onClose, 
  onSave, 
  mode,
  selectedDate 
}) => {
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: selectedDate || new Date(),
    endDate: null as Date | null,
    labels: [] as Array<{ name: string; color: string }>,
    assignees: [] as Array<{ login: string; avatar_url: string }>,
    status: 'open' as 'open' | 'closed'
  });

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate || null,
        labels: event.labels,
        assignees: event.assignees,
        status: event.status
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate,
        endDate: null
      }));
    }
  }, [event, selectedDate]);

  // Reset editing state when mode changes
  useEffect(() => {
    setIsEditing(mode === 'edit' || mode === 'create');
  }, [mode]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      // Include the event ID when editing an existing issue
      const saveData = mode === 'edit' && event ? { ...formData, id: event.id } : formData;
      await onSave(saveData);
      
      // Only close modal after successful save
      if (mode === 'create') {
        onClose();
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save issue. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'create') {
      onClose();
    } else {
      setIsEditing(false);
      // Reset form data to original event data
      if (event) {
        setFormData({
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate || null,
          labels: event.labels,
          assignees: event.assignees,
          status: event.status
        });
      }
    }
  };

  const addLabel = () => {
    const name = prompt('Enter label name:');
    if (name) {
      const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, { name, color }]
      }));
    }
  };

  const removeLabel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== index)
    }));
  };

  const addAssignee = () => {
    const login = prompt('Enter GitHub username:');
    if (login) {
      const newAssignee = {
        login,
        avatar_url: `https://github.com/${login}.png`
      };
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, newAssignee]
      }));
    }
  };

  const removeAssignee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none pb-2"
                  placeholder="Enter issue title..."
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 mb-2">{formData.title}</h2>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'open' | 'closed' }))}
                    className="px-2 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    formData.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.status === 'open' ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {formData.status}
                  </span>
                )}
                <span className="capitalize">Issue</span>
                {mode === 'create' && (
                  <span className="text-blue-600 font-medium">New Issue</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Dates */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-medium">Timeline</span>
            </div>
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="font-medium w-16">Start:</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={format(formData.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      startDate: new Date(e.target.value) 
                    }))}
                    className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span>{format(formData.startDate, 'PPP')}</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-medium w-16">End:</span>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endDate: e.target.value ? new Date(e.target.value) : null 
                      }))}
                      className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.endDate && (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, endDate: null }))}
                        className="text-red-500 hover:text-red-700"
                        title="Remove end date"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span>{formData.endDate ? format(formData.endDate, 'PPP') : 'No end date'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span className="font-medium">Labels</span>
              </div>
              {isEditing && (
                <button
                  onClick={addLabel}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Label</span>
                </button>
              )}
            </div>
            <div className="ml-6 flex flex-wrap gap-2">
              {formData.labels.length > 0 ? (
                formData.labels.map((label, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    {isEditing && (
                      <button
                        onClick={() => removeLabel(index)}
                        className="hover:bg-black/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No labels</span>
              )}
            </div>
          </div>

          {/* Assignees */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">Assignees</span>
              </div>
              {isEditing && (
                <button
                  onClick={addAssignee}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Assignee</span>
                </button>
              )}
            </div>
            <div className="ml-6 flex flex-wrap gap-3">
              {formData.assignees.length > 0 ? (
                formData.assignees.map((assignee, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-full pl-1 pr-3 py-1">
                    <img
                      src={assignee.avatar_url}
                      alt={assignee.login}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-700">{assignee.login}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeAssignee(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No assignees</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {event && event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-2"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !formData.title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{mode === 'create' ? 'Create Issue' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  {mode !== 'create' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit Issue
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueModal;
