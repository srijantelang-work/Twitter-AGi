'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface ContentItem {
  id: string
  content: string
  contentType: string
  status: string
  scheduledAt?: string
  hashtags: string[]
  emojis: string[]
  confidence: number
  createdAt: string
}

interface QueueStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

interface ContentAnalytics {
  totalContent: number
  averageEngagementRate: number
  topPerformingContent: any[]
  contentTypePerformance: Record<string, number>
  trendingTopics: string[]
}

export default function ContentDashboard() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Content creation state
  const [contentType, setContentType] = useState('varied')
  const [context, setContext] = useState('')
  const [includeEngagementPrompt, setIncludeEngagementPrompt] = useState(true)
  const [includeFollowUp, setIncludeFollowUp] = useState(false)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch content data
      const contentResponse = await fetch('/api/content/calendar?userId=current&days=30')
      const contentData = await contentResponse.json()
      
      if (contentData.success) {
        setContent(contentData.data.scheduledContent || [])
      }

      // Fetch queue statistics
      const queueResponse = await fetch('/api/content/queue/stats')
      const queueData = await queueResponse.json()
      
      if (queueData.success) {
        setQueueStats(queueData.data)
      }

      // Fetch analytics
      const analyticsResponse = await fetch('/api/content/analytics?userId=current&days=30')
      const analyticsData = await analyticsResponse.json()
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data)
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewContent = async (type: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai/autonomous-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: type,
          context: context || `Generate ${type} content for the AI Superconnector brand`,
          includeEngagementPrompt,
          includeFollowUp
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSelectedContent(data.data.content)
        setError(null)
        // Refresh dashboard data
        await fetchDashboardData()
      } else {
        setError(data.error || 'Failed to generate content')
      }
    } catch (error) {
      setError('Failed to generate content')
      console.error('Error generating content:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">AI Superconnector Content</h2>
          <p className="text-gray-600 mt-2">
            Generate, manage, and schedule AI-powered content for your brand
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generateNewContent('varied')} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Generate Varied Content
          </Button>
        </div>
      </div>

      {/* Main Content Grid - Matching Always Listening Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Content Creation Form */}
        <div className="md:col-span-1">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Content Creation</CardTitle>
              <CardDescription className="text-gray-600">
                Generate AI-powered content for your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="contentType" className="text-sm font-medium text-gray-900">Content Type</Label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="varied">🎲 Varied Content</option>
                  <option value="networking_tips">🤝 Networking Tips</option>
                  <option value="ai_insights">🧠 AI Insights</option>
                  <option value="startup_humor">😄 Startup Humor</option>
                  <option value="community_building">👥 Community Building</option>
                  <option value="connection_stories">📖 Connection Stories</option>
                  <option value="tech_trends">🚀 Tech Trends</option>
                </select>
              </div>

              {/* Context Input */}
              <div className="space-y-2">
                <Label htmlFor="context" className="text-sm font-medium text-gray-900">Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide additional context or specific requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="engagementPrompt"
                    checked={includeEngagementPrompt}
                    onCheckedChange={setIncludeEngagementPrompt}
                  />
                  <Label htmlFor="engagementPrompt" className="text-sm text-gray-700">Include engagement prompt</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="followUp"
                    checked={includeFollowUp}
                    onCheckedChange={setIncludeFollowUp}
                  />
                  <Label htmlFor="followUp" className="text-sm text-gray-700">Include follow-up content</Label>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={() => generateNewContent(contentType)} 
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </Button>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content Management */}
        <div className="md:col-span-2">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Content Management</CardTitle>
              <CardDescription className="text-gray-600">
                Review, edit, and schedule your generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Content Preview Section */}
              {selectedContent ? (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">Generated Content:</h4>
                    <p className="text-sm text-gray-700 mb-3">{selectedContent.content}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      {selectedContent.hashtags?.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-gray-200 text-gray-700">
                          {tag}
                        </Badge>
                      ))}
                      {selectedContent.emojis?.map((emoji: string, index: number) => (
                        <span key={index}>{emoji}</span>
                      ))}
                    </div>
                  </div>

                  {/* Content Actions */}
                  <div className="flex items-center space-x-3">
                    <Button 
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      Edit & Customize
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Schedule Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm">Generate content to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
