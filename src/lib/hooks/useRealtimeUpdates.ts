import { useState, useEffect, useCallback } from 'react';
import { realtimeService } from '@/lib/realtime/subscriptions';
import { AIResponse, ContentSchedule } from '@/types/database';

interface TweetData {
  id: string;
  user: string;
  handle: string;
  text: string;
  tags: string[];
  minutesAgo: number;
  engagement: number;
}

interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  error: string | null;
  subscribeToTweets: (callback: (data: TweetData) => void) => () => void;
  subscribeToResponses: (callback: (data: AIResponse) => void) => () => void;
  subscribeToContent: (callback: (data: ContentSchedule) => void) => () => void;
}

export function useRealtimeUpdates(): UseRealtimeUpdatesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribeToTweets = useCallback((callback: (data: TweetData) => void) => {
    try {
      const subscriptionId = realtimeService.subscribeToTweets((payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as unknown as TweetData);
        }
      });
      
      if (subscriptionId === 'no_client' || subscriptionId === 'error') {
        setError('Failed to subscribe to tweets - service not available');
        setIsConnected(false);
        return () => {}; // Return empty unsubscribe function
      }
      
      setIsConnected(true);
      setError(null);
      return () => realtimeService.unsubscribe(subscriptionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to tweets');
      setIsConnected(false);
      return () => {}; // Return empty unsubscribe function
    }
  }, []);

  const subscribeToResponses = useCallback((callback: (data: AIResponse) => void) => {
    try {
      const subscriptionId = realtimeService.subscribeToResponses((payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as unknown as AIResponse);
        }
      });
      
      if (subscriptionId === 'no_client' || subscriptionId === 'error') {
        setError('Failed to subscribe to responses - service not available');
        setIsConnected(false);
        return () => {}; // Return empty unsubscribe function
      }
      
      setIsConnected(true);
      setError(null);
      return () => realtimeService.unsubscribe(subscriptionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to responses');
      setIsConnected(false);
      return () => {}; // Return empty unsubscribe function
    }
  }, []);

  const subscribeToContent = useCallback((callback: (data: ContentSchedule) => void) => {
    try {
      const subscriptionId = realtimeService.subscribeToContent((payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as unknown as ContentSchedule);
        }
      });
      
      if (subscriptionId === 'no_client' || subscriptionId === 'error') {
        setError('Failed to subscribe to content - service not available');
        setIsConnected(false);
        return () => {}; // Return empty unsubscribe function
      }
      
      setIsConnected(true);
      setError(null);
      return () => realtimeService.unsubscribe(subscriptionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to content');
      setIsConnected(false);
      return () => {}; // Return empty unsubscribe function
    }
  }, []);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Initialize connection status based on active subscriptions
    setIsConnected(realtimeService.getActiveSubscriptionCount() > 0);
    
    // Set up connection monitoring
    const checkConnection = () => {
      setIsConnected(realtimeService.getActiveSubscriptionCount() > 0);
    };

    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    isConnected,
    error,
    subscribeToTweets,
    subscribeToResponses,
    subscribeToContent,
  };
}
