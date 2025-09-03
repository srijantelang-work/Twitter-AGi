"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquareQuote, RefreshCw, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ReplySuggestions } from "./reply-suggestions"
import { ReplySuggestion, Tone } from "@/lib/ai/reply-generator"

interface TweetData {
  id: string
  text: string
  author_id: string
  created_at: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
}

interface TwitterSearchResult {
  tweets: TweetData[]
  includes?: {
    users?: Array<{
      id: string
      username: string
      name: string
      profile_image_url?: string
    }>
  }
  searchQuery: string
  keywords: string[]
  message?: string
}

type FeedItem = {
  id: string
  user: string
  handle: string
  text: string
  tags: string[]
  minutesAgo: number
  engagement: number
}

const TONES: Record<string, { name: string; description: string }> = {
  HELPFUL: { name: 'Helpful', description: 'Genuine assistance and value' },
  WITTY: { name: 'Witty', description: 'Clever humor and wordplay' },
  PLAYFUL: { name: 'Playful', description: 'Fun and lighthearted interaction' },
  CONFIDENT: { name: 'Confident', description: 'Assured and authoritative tone' },
  THOUGHTFUL: { name: 'Thoughtful', description: 'Reflective and insightful commentary' }
}

export function LiveFeed({ className }: { className?: string }) {
  const [tweets, setTweets] = useState<TweetData[]>([])
  const [users, setUsers] = useState<Record<string, { username: string; name: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [keywords, setKeywords] = useState<string[]>([])
  
  // AI Reply Suggestion states
  const [selectedTone, setSelectedTone] = useState<Tone>('HELPFUL')
  const [replySuggestions, setReplySuggestions] = useState<Record<string, ReplySuggestion[]>>({})
  const [generatingReplies, setGeneratingReplies] = useState<Record<string, boolean>>({})
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({})

  // Transform tweets to feed items
  const transformTweetsToFeed = (tweets: TweetData[]): FeedItem[] => {
    return tweets.map(tweet => {
      const user = users[tweet.author_id] || { username: 'Unknown User', name: 'Unknown User' }
      const engagement = tweet.public_metrics ? 
        tweet.public_metrics.retweet_count + tweet.public_metrics.reply_count + 
        tweet.public_metrics.like_count + tweet.public_metrics.quote_count : 0
      
      return {
        id: tweet.id,
        user: user.name,
        handle: user.username,
        text: tweet.text,
        tags: keywords,
        minutesAgo: tweet.created_at ? Math.floor((Date.now() - new Date(tweet.created_at).getTime()) / 60000) : 0,
        engagement
      }
    })
  }

  const searchTwitter = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/twitter/search-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search Twitter')
      }
      
      const data: TwitterSearchResult = await response.json()
      
      if (data.tweets.length === 0) {
        setTweets([])
        setError(data.message || 'No tweets found')
        return
      }
      
      setTweets(data.tweets)
      setSearchQuery(data.searchQuery)
      setKeywords(data.keywords)
      
      // Process user data from includes
      if (data.includes?.users) {
        const userMap: Record<string, { username: string; name: string }> = {}
        data.includes.users.forEach(user => {
          userMap[user.id] = { username: user.username, name: user.name }
        })
        setUsers(userMap)
      }
      
      setError(null)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search Twitter')
      console.error('Error searching Twitter:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    searchTwitter()
  }

  const handleSuggestReply = async (tweetId: string, tweetContent: string, authorUsername: string) => {
    try {
      setGeneratingReplies(prev => ({ ...prev, [tweetId]: true }))
      setShowSuggestions(prev => ({ ...prev, [tweetId]: true }))
      
      const response = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetId,
          tweetContent,
          authorUsername,
          userKeywords: keywords,
          tone: selectedTone,
          engagementMetrics: tweets.find(t => t.id === tweetId)?.public_metrics
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate reply suggestions')
      }
      
      const data = await response.json()
      if (data.success && data.suggestions) {
        setReplySuggestions(prev => ({ ...prev, [tweetId]: data.suggestions }))
      } else {
        throw new Error('Invalid response from AI service')
      }
      
    } catch (error) {
      console.error('Failed to generate reply suggestions:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate replies')
    } finally {
      setGeneratingReplies(prev => ({ ...prev, [tweetId]: false }))
    }
  }

  const handleRegenerateReplies = (tweetId: string) => {
    const tweet = tweets.find(t => t.id === tweetId)
    if (tweet) {
      const user = users[tweet.author_id]
      handleSuggestReply(tweetId, tweet.text, user?.username || 'Unknown User')
    }
  }

  const handleToneChange = (tone: Tone) => {
    setSelectedTone(tone)
    // Clear existing suggestions when tone changes
    setReplySuggestions({})
    setShowSuggestions({})
  }

  // Search on component mount
  useEffect(() => {
    searchTwitter()
  }, [])

  const localTweets = transformTweetsToFeed(tweets)

  if (loading && tweets.length === 0) {
    return (
      <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquareQuote className="h-5 w-5 text-cyan-600" />
            Live Intent Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-gray-200 p-3 animate-pulse bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tone Selection */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            AI Reply Tone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TONES).map(([key, tone]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedTone === key ? "default" : "outline"}
                onClick={() => handleToneChange(key as Tone)}
                className={cn(
                  selectedTone === key 
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white" 
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                {tone.name}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: <strong>{TONES[selectedTone].name}</strong> - {TONES[selectedTone].description}
          </p>
        </CardContent>
      </Card>

      {/* Live Feed */}
      <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquareQuote className="h-5 w-5 text-cyan-600" />
            Live Intent Feed
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>🟢 {localTweets.length} tweets</span>
              {keywords.length > 0 && (
                <span>• {keywords.length} filters</span>
              )}
            </div>
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 p-3 bg-red-50 rounded-md border border-red-200">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {searchQuery && (
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
              <strong>Search:</strong> {searchQuery}
            </div>
          )}

          {localTweets.length === 0 && !error ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquareQuote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tweets found</p>
              <p className="text-sm">Try adding some intent filters and refreshing</p>
            </div>
          ) : (
            localTweets.map((item) => (
              <div key={item.id} className="space-y-4">
                <article className="rounded-md border border-gray-200 p-3 bg-gray-50">
                  <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700">{item.user.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none text-gray-900">{item.user}</p>
                        <p className="text-xs text-gray-500">@{item.handle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <time className="text-xs text-gray-500">{item.minutesAgo}m</time>
                      {item.engagement > 0 && (
                        <div className="text-xs text-gray-400">❤️ {item.engagement}</div>
                      )}
                    </div>
                  </header>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.text}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-cyan-200 text-cyan-700 bg-cyan-50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSuggestReply(item.id, item.text, item.handle)}
                        disabled={generatingReplies[item.id]}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        {generatingReplies[item.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Suggest Reply
                          </>
                        )}
                      </Button>

                    </div>
                  </div>
                </article>

                {/* AI Reply Suggestions */}
                {showSuggestions[item.id] && (
                  <ReplySuggestions
                    suggestions={replySuggestions[item.id] || []}
                    tone={TONES[selectedTone].name}
                    tweetId={item.id}
                    onRegenerate={() => handleRegenerateReplies(item.id)}
                    isLoading={generatingReplies[item.id]}
                    className="ml-4"
                  />
                )}
              </div>
            ))
          )}
          
          <p className="text-xs text-gray-500">
            Tip: Build detection around phrases like &ldquo;looking for&rdquo;, &ldquo;anyone know&rdquo;, &ldquo;intro to&rdquo;, &ldquo;meeting in SF&rdquo;. Showing up to 10 most recent tweets for optimal performance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
