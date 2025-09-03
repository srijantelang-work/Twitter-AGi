import { useState, useEffect } from 'react';
import { AIResponse } from '@/types/database';

interface UseAgentResponsesReturn {
  responses: AIResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  approveResponse: (id: string) => Promise<void>;
  rejectResponse: (id: string) => Promise<void>;
  generateResponse: (tweetId: string, intent: string) => Promise<void>;
}

export function useAgentResponses(): UseAgentResponsesReturn {
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/ai/responses');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  };

  const approveResponse = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/responses/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchResponses(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve response');
      throw err;
    }
  };

  const rejectResponse = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/responses/${id}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchResponses(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject response');
      throw err;
    }
  };

  const generateResponse = async (tweetId: string, intent: string) => {
    try {
      const response = await fetch('/api/ai/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet_id: tweetId, intent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchResponses(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate response');
      throw err;
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  return {
    responses,
    loading,
    error,
    refresh: fetchResponses,
    approveResponse,
    rejectResponse,
    generateResponse,
  };
}
