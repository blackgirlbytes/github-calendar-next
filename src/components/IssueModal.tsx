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
  CheckCircle2,
  Activity
} from 'lucide-react';
import { CalendarEvent } from '@/types/github';
import { useStatusFields } from '@/hooks/useStatusFields';

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
    status: 'open' as 'open' | 'closed',
    projectStatus: '' as string
  });
  
  // State for assignee input
  const [newAssigneeInput, setNewAssigneeInput] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [filteredAssignees, setFilteredAssignees] = useState<Array<{ login: string; avatar_url: string }>>([]);
  
  // State for label input
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [filteredLabels, setFilteredLabels] = useState<Array<{ name: string; color: string }>>([]);
  
  // DevRel team members
  const commonAssignees = [
    { login: 'taniashiba', avatar_url: 'https://github.com/taniashiba.png' },
    { login: 'blackgirlbytes', avatar_url: 'https://github.com/blackgirlbytes.png' },
    { login: 'emma-squared', avatar_url: 'https://github.com/emma-squared.png' },
    { login: 'dianed-square', avatar_url: 'https://github.com/dianed-square.png' },
    { login: 'iandouglas', avatar_url: 'https://github.com/iandouglas.png' },
    { login: 'angiejones', avatar_url: 'https://github.com/angiejones.png' },
    { login: 'EbonyLouis', avatar_url: 'https://github.com/EbonyLouis.png' },
    { login: 'agiuliano-square', avatar_url: 'https://github.com/agiuliano-square.png' },
  ];

  // Repository labels - will be fetched and cached
  const [repositoryLabels, setRepositoryLabels] = useState<Array<{ name: string; color: string }>>([]);
  
  // Status fields hook
  const { statusFields, loading: statusFieldsLoading, error: statusFieldsError } = useStatusFields();

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate || null,
        labels: event.labels,
        assignees: event.assignees,
        status: event.status,
        projectStatus: event.projectStatus || ''
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

  // Fetch repository labels when modal opens (only once)
  useEffect(() => {
    if (isOpen && repositoryLabels.length === 0) {
      const fetchLabels = async () => {
        try {
          const response = await fetch('/api/labels');
          if (response.ok) {
            const data = await response.json();
            setRepositoryLabels(data.labels || []);
          }
        } catch (error) {
          console.warn('Failed to fetch repository labels:', error);
          // Silently fail - user can still create custom labels
        }
      };
      fetchLabels();
    }
  }, [isOpen, repositoryLabels.length]);

  const handleSave = async () => {
    console.log('🔥 handleSave called!', { mode, event, formData, isEditing });
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      // Include the event ID when editing an existing issue
      const saveData = (mode === 'edit' || isEditing) && event ? { ...formData, id: event.id } : formData;
      console.log('🚀 About to call onSave with:', saveData);
      
      await onSave(saveData);
      
      console.log('✅ onSave completed successfully');
      
      // Only close modal after successful save
      if (mode === 'create') {
        onClose();
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('❌ Error saving issue:', error);
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
          status: event.status,
          projectStatus: event.projectStatus || ''
        });
      }
    }
  };

  const addLabel = (label: { name: string; color: string }) => {
    if (!formData.labels.find(l => l.name === label.name)) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, label]
      }));
      setNewLabelInput('');
      setShowLabelDropdown(false);
    }
  };

  const handleLabelInputChange = (value: string) => {
    setNewLabelInput(value);
    
    if (value.trim()) {
      // Filter repository labels based on input
      const filtered = repositoryLabels.filter(label => 
        label.name.toLowerCase().includes(value.toLowerCase()) &&
        !formData.labels.find(l => l.name === label.name)
      );
      setFilteredLabels(filtered);
      setShowLabelDropdown(filtered.length > 0);
    } else {
      setShowLabelDropdown(false);
      setFilteredLabels([]);
    }
  };

  const handleLabelInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLabels.length > 0) {
        // If there are suggestions, use the first one
        addLabel(filteredLabels[0]);
      } else if (newLabelInput.trim()) {
        // Otherwise, create a new label from the input
        addLabel({
          name: newLabelInput.trim(),
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        });
      }
    } else if (e.key === 'Escape') {
      setShowLabelDropdown(false);
    }
  };

  const handleLabelAddButtonClick = () => {
    if (filteredLabels.length > 0) {
      // If there are suggestions, use the first one
      addLabel(filteredLabels[0]);
    } else if (newLabelInput.trim()) {
      // Otherwise, create a new label from the input
      addLabel({
        name: newLabelInput.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      });
    }
  };

  const removeLabel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== index)
    }));
  };

  const addAssignee = (assignee: { login: string; avatar_url: string }) => {
    if (!formData.assignees.find(a => a.login === assignee.login)) {
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, assignee]
      }));
      setNewAssigneeInput('');
      setShowAssigneeDropdown(false);
    }
  };

  const handleAssigneeInputChange = (value: string) => {
    setNewAssigneeInput(value);
    
    if (value.trim()) {
      // Filter common assignees based on input
      const filtered = commonAssignees.filter(assignee => 
        assignee.login.toLowerCase().includes(value.toLowerCase()) &&
        !formData.assignees.find(a => a.login === assignee.login)
      );
      setFilteredAssignees(filtered);
      setShowAssigneeDropdown(filtered.length > 0);
    } else {
      setShowAssigneeDropdown(false);
      setFilteredAssignees([]);
    }
  };

  const handleAssigneeInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAssignees.length > 0) {
        // If there are suggestions, use the first one
        addAssignee(filteredAssignees[0]);
      } else if (newAssigneeInput.trim()) {
        // Otherwise, create a new assignee from the input
        addAssignee({
          login: newAssigneeInput.trim(),
          avatar_url: `https://github.com/${newAssigneeInput.trim()}.png`
        });
      }
    } else if (e.key === 'Escape') {
      setShowAssigneeDropdown(false);
    }
  };

  const handleAddButtonClick = () => {
    if (filteredAssignees.length > 0) {
      // If there are suggestions, use the first one
      addAssignee(filteredAssignees[0]);
    } else if (newAssigneeInput.trim()) {
      // Otherwise, create a new assignee from the input
      addAssignee({
        login: newAssigneeInput.trim(),
        avatar_url: `https://github.com/${newAssigneeInput.trim()}.png`
      });
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(1px)' }}>
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
                <span className="font-semibold text-gray-800 w-16">Start:</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={format(formData.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      startDate: new Date(e.target.value) 
                    }))}
                    className="border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <span className="text-gray-800 font-medium">{format(formData.startDate, 'PPP')}</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-800 w-16">End:</span>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endDate: e.target.value ? new Date(e.target.value) : null 
                      }))}
                      className="border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <span className="text-gray-800 font-medium">{formData.endDate ? format(formData.endDate, 'PPP') : 'No end date'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <Tag className="w-4 h-4" />
              <span className="font-medium">Labels</span>
            </div>
            <div className="ml-6">
              {/* Current labels */}
              <div className="flex flex-wrap gap-2 mb-3">
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
              
              {/* Add label input (only in edit mode) */}
              {isEditing && (
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newLabelInput}
                      onChange={(e) => handleLabelInputChange(e.target.value)}
                      onKeyPress={handleLabelInputKeyPress}
                      placeholder="Enter label name..."
                      className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1"
                    />
                    <button
                      onClick={handleLabelAddButtonClick}
                      disabled={!newLabelInput.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {/* Dropdown with label suggestions */}
                  {showLabelDropdown && filteredLabels.length > 0 && (
                    <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredLabels.map((label, index) => (
                        <button
                          key={label.name}
                          onClick={() => addLabel(label)}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 text-left"
                        >
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: label.color }}
                          ></div>
                          <span className="text-sm text-gray-700">{label.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Project Status */}
          {statusFields.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <Activity className="w-4 h-4" />
                <span className="font-medium">Project Status</span>
              </div>
              <div className="ml-6">
                {isEditing ? (
                  <select
                    value={formData.projectStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectStatus: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status...</option>
                    {statusFields[0]?.options.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    formData.projectStatus 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-500'
                  }`}>
                    {formData.projectStatus || 'No status set'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Assignees */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <User className="w-4 h-4" />
              <span className="font-medium">Assignees</span>
            </div>
            <div className="ml-6">
              {/* Current assignees */}
              <div className="flex flex-wrap gap-3 mb-3">
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
              
              {/* Add assignee input (only in edit mode) */}
              {isEditing && (
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newAssigneeInput}
                      onChange={(e) => handleAssigneeInputChange(e.target.value)}
                      onKeyPress={handleAssigneeInputKeyPress}
                      placeholder="Enter GitHub username..."
                      className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1"
                    />
                    <button
                      onClick={handleAddButtonClick}
                      disabled={!newAssigneeInput.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {/* Dropdown with suggestions */}
                  {showAssigneeDropdown && filteredAssignees.length > 0 && (
                    <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredAssignees.map((assignee, index) => (
                        <button
                          key={assignee.login}
                          onClick={() => addAssignee(assignee)}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 text-left"
                        >
                          <img
                            src={assignee.avatar_url}
                            alt={assignee.login}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-700">{assignee.login}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
