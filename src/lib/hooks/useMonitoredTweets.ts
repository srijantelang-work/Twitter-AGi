import { useState, useEffect } from 'react';

interface TwitterTweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterSearchResult {
  tweets: TwitterTweetData[];
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
    }>;
  };
  keywords: string[];
  source?: 'twitter_api' | 'rate_limited' | 'cached';
  message?: string;
  retryAfter?: string;
}

interface TweetData {
  id: string;
  user: string;
  handle: string;
  text: string;
  tags: string[];
  minutesAgo: number;
  engagement: number;
}

interface UseTwitterSearchReturn {
  tweets: TweetData[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addTweet: (tweet: Partial<TweetData>) => Promise<void>;
  updateTweet: (id: string, updates: Partial<TweetData>) => Promise<void>;
  deleteTweet: (id: string) => Promise<void>;
}

// Transform Twitter API response to TweetData format
const transformTwitterTweetsToTweetData = (
  twitterTweets: TwitterTweetData[], 
  users: Record<string, { username: string; name: string }> = {},
  keywords: string[] = []
): TweetData[] => {
  return twitterTweets.map(tweet => {
    const user = users[tweet.author_id] || { username: 'Unknown User', name: 'Unknown User' };
    const engagement = tweet.public_metrics ? 
      tweet.public_metrics.retweet_count + tweet.public_metrics.reply_count + 
      tweet.public_metrics.like_count + tweet.public_metrics.quote_count : 0;
    
    return {
      id: tweet.id,
      user: user.name,
      handle: `@${user.username}`,
      text: tweet.text,
      tags: keywords,
      minutesAgo: tweet.created_at ? Math.floor((Date.now() - new Date(tweet.created_at).getTime()) / 60000) : 0,
      engagement
    };
  });
};

export function useTwitterSearch(): UseTwitterSearchReturn {
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🔍 useTwitterSearch hook state:', { tweets, loading, error })

  const fetchTweets = async () => {
    console.log('📡 useTwitterSearch fetchTweets called')
    try {
      setLoading(true);
      setError(null);
      console.log('📡 useTwitterSearch making API call to /api/twitter/search-live')
      
      const response = await fetch('/api/twitter/search-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('📡 useTwitterSearch API response status:', response.status)
      console.log('📡 useTwitterSearch API response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useTwitterSearch API error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TwitterSearchResult = await response.json();
      console.log('✅ useTwitterSearch API response data:', data)
      console.log('✅ useTwitterSearch API response data.tweets:', data.tweets)
      
      // Handle rate limiting
      if (data.source === 'rate_limited') {
        console.log('⚠️ Twitter API rate limited:', data.message)
        setError(`Twitter API rate limited. ${data.message || 'Please try again later.'}`)
        setTweets([]);
        return;
      }
      
      // Transform users data
      const users: Record<string, { username: string; name: string }> = {};
      if (data.includes?.users) {
        data.includes.users.forEach(user => {
          users[user.id] = { username: user.username, name: user.name };
        });
      }
      
      // Transform Twitter tweets to TweetData format
      const tweetData = transformTwitterTweetsToTweetData(
        data.tweets || [], 
        users, 
        data.keywords || []
      );
      
      console.log('✅ useTwitterSearch setting tweets state to:', tweetData)
      setTweets(tweetData);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('❌ useTwitterSearch fetchTweets error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
    } finally {
      console.log('✅ useTwitterSearch fetchTweets completed, setting loading to false')
      setLoading(false);
    }
  };

  const addTweet = async (tweet: Partial<TweetData>) => {
    console.log('➕ useTwitterSearch addTweet called with:', tweet)
    // Since we're now using live search, we can't add tweets directly
    // Just refresh to get latest data
    await fetchTweets();
  };

  const updateTweet = async (id: string, updates: Partial<TweetData>) => {
    console.log('✏️ useTwitterSearch updateTweet called with id:', id, 'updates:', updates)
    // Since we're now using live search, we can't update tweets directly
    // Just refresh to get latest data
    await fetchTweets();
  };

  const deleteTweet = async (id: string) => {
    console.log('🗑️ useTwitterSearch deleteTweet called with id:', id)
    // Since we're now using live search, we can't delete tweets directly
    // Just refresh to get latest data
    await fetchTweets();
  };

  useEffect(() => {
    console.log('🔄 useTwitterSearch useEffect triggered, calling fetchTweets')
    fetchTweets();
  }, []);

  console.log('🔍 useTwitterSearch hook returning:', { tweets, loading, error, refresh: fetchTweets, addTweet, updateTweet, deleteTweet })

  return {
    tweets,
    loading,
    error,
    refresh: fetchTweets,
    addTweet,
    updateTweet,
    deleteTweet,
  };
}
