import { useState, useEffect } from 'react';
import { ContentSchedule } from '@/types/database';

interface UseContentScheduleReturn {
  scheduledContent: ContentSchedule[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addContent: (content: Partial<ContentSchedule>) => Promise<void>;
  updateContent: (id: string, updates: Partial<ContentSchedule>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
}

export function useContentSchedule(): UseContentScheduleReturn {
  const [scheduledContent, setScheduledContent] = useState<ContentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/content/schedule');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setScheduledContent(data.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduled content');
    } finally {
      setLoading(false);
    }
  };

  const addContent = async (content: Partial<ContentSchedule>) => {
    try {
      const response = await fetch('/api/content/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchContent(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add content');
      throw err;
    }
  };

  const updateContent = async (id: string, updates: Partial<ContentSchedule>) => {
    try {
      const response = await fetch(`/api/content/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchContent(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
      throw err;
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const response = await fetch(`/api/content/schedule/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchContent(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
      throw err;
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    scheduledContent,
    loading,
    error,
    refresh: fetchContent,
    addContent,
    updateContent,
    deleteContent,
  };
}
