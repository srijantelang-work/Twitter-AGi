import { useState, useEffect } from 'react';

interface StatsData {
  totalTweets: number;
  totalResponses: number;
  pendingResponses: number;
  approvedResponses: number;
  rejectedResponses: number;
  scheduledContent: number;
  publishedContent: number;
  failedContent: number;
  engagementRate: number;
  responseTime: number;
}

interface UseStatsReturn {
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface Response {
  status: 'pending' | 'approved' | 'rejected';
}

interface Content {
  status: 'pending' | 'published' | 'failed';
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats from multiple endpoints and combine them
      const [tweetsResponse, responsesResponse, contentResponse] = await Promise.all([
        fetch('/api/twitter/search-live', { method: 'POST', headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/ai/responses'),
        fetch('/api/content/schedule')
      ]);

      if (!tweetsResponse.ok || !responsesResponse.ok || !contentResponse.ok) {
        throw new Error('Failed to fetch stats data');
      }

      const [tweetsData, responsesData, contentData] = await Promise.all([
        tweetsResponse.json(),
        responsesResponse.json(),
        contentResponse.json()
      ]);

      const tweets = tweetsData.tweets || [];
      const responses = responsesData.responses || [];
      const content = contentData.content || [];

      // Calculate statistics
      const totalTweets = tweets.length;
      const totalResponses = responses.length;
      const pendingResponses = responses.filter((r: Response) => r.status === 'pending').length;
      const approvedResponses = responses.filter((r: Response) => r.status === 'approved').length;
      const rejectedResponses = responses.filter((r: Response) => r.status === 'rejected').length;
      const scheduledContent = content.filter((c: Content) => c.status === 'pending').length;
      const publishedContent = content.filter((c: Content) => c.status === 'published').length;
      const failedContent = content.filter((c: Content) => c.status === 'failed').length;

      // Calculate engagement rate (simplified)
      const engagementRate = totalTweets > 0 ? (totalResponses / totalTweets) * 100 : 0;
      
      // Calculate average response time (simplified)
      const responseTime = totalResponses > 0 ? 5.2 : 0; // Mock average time in minutes

      setStats({
        totalTweets,
        totalResponses,
        pendingResponses,
        approvedResponses,
        rejectedResponses,
        scheduledContent,
        publishedContent,
        failedContent,
        engagementRate: Math.round(engagementRate * 100) / 100,
        responseTime
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
