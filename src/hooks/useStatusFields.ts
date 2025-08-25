'use client';

import { useState, useEffect } from 'react';
import { ProjectStatusField } from '@/types/github';

interface UseStatusFieldsReturn {
  statusFields: ProjectStatusField[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStatusFields(): UseStatusFieldsReturn {
  const [statusFields, setStatusFields] = useState<ProjectStatusField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusFields = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/status-fields');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setStatusFields(data.statusFields || []);
      
      console.log('✅ Status fields loaded:', data.statusFields?.length || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status fields';
      console.error('❌ Error fetching status fields:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusFields();
  }, []);

  return {
    statusFields,
    loading,
    error,
    refetch: fetchStatusFields,
  };
}
