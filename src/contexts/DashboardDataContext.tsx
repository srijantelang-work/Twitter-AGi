'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTwitterSearch } from '@/lib/hooks/useMonitoredTweets';
import { useAgentResponses } from '@/lib/hooks/useAgentResponses';
import { useContentSchedule } from '@/lib/hooks/useContentSchedule';
import { useStats } from '@/lib/hooks/useStats';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
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

interface DashboardDataContextType {
  tweets: {
    data: TweetData[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    addTweet: (tweet: Partial<TweetData>) => Promise<void>;
    updateTweet: (id: string, updates: Partial<TweetData>) => Promise<void>;
    deleteTweet: (id: string) => Promise<void>;
  };
  responses: {
    data: AIResponse[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    approveResponse: (id: string) => Promise<void>;
    rejectResponse: (id: string) => Promise<void>;
    generateResponse: (tweetId: string, intent: string) => Promise<void>;
  };
  content: {
    data: ContentSchedule[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    addContent: (content: Partial<ContentSchedule>) => Promise<void>;
    updateContent: (id: string, updates: Partial<ContentSchedule>) => Promise<void>;
    deleteContent: (id: string) => Promise<void>;
  };
  stats: {
    data: StatsData | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
  };
  realtime: {
    isConnected: boolean;
    error: string | null;
    subscribeToTweets: (callback: (data: TweetData) => void) => () => void;
    subscribeToResponses: (callback: (data: AIResponse) => void) => () => void;
    subscribeToContent: (callback: (data: ContentSchedule) => void) => () => void;
  };
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const tweets = useTwitterSearch();
  const responses = useAgentResponses();
  const content = useContentSchedule();
  const stats = useStats();
  const realtime = useRealtimeUpdates();

  const value: DashboardDataContextType = {
    tweets: {
      data: tweets.tweets,
      loading: tweets.loading,
      error: tweets.error,
      refresh: tweets.refresh,
      addTweet: tweets.addTweet,
      updateTweet: tweets.updateTweet,
      deleteTweet: tweets.deleteTweet,
    },
    responses: {
      data: responses.responses,
      loading: responses.loading,
      error: responses.error,
      refresh: responses.refresh,
      approveResponse: responses.approveResponse,
      rejectResponse: responses.rejectResponse,
      generateResponse: responses.generateResponse,
    },
    content: {
      data: content.scheduledContent,
      loading: content.loading,
      error: content.error,
      refresh: content.refresh,
      addContent: content.addContent,
      updateContent: content.updateContent,
      deleteContent: content.deleteContent,
    },
    stats: {
      data: stats.stats,
      loading: stats.loading,
      error: stats.error,
      refresh: stats.refresh,
    },
    realtime,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
