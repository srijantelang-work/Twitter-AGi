'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'

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



export default function ContentDashboard() {
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(false)
  
  // Content creation state
  const [contentType, setContentType] = useState('varied')
  const [context, setContext] = useState('')
  const [includeEngagementPrompt, setIncludeEngagementPrompt] = useState(true)
  const [includeFollowUp, setIncludeFollowUp] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch content data (no userId needed - API will use authenticated user)
      const contentResponse = await fetch('/api/content/calendar?days=30', {
        credentials: 'include'
      })
      if (!contentResponse.ok) {
        throw new Error(`Content API error: ${contentResponse.status}`)
      }
      const contentData = await contentResponse.json()
      
      if (!contentData.success) {
        console.warn('Content API returned error:', contentData.error)
      }





    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  const generateNewContent = async (type: string) => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai/autonomous-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  useEffect(() => {
    // Only fetch data when user is authenticated
    if (user && !authLoading) {
      fetchDashboardData()
    }
  }, [user, authLoading, fetchDashboardData])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 font-satoshi">
        <div className="text-lg font-satoshi-medium">Loading authentication...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 font-satoshi">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-lg text-gray-600 font-satoshi-medium">Please log in to access content generation</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-satoshi">
        <div className="text-lg font-satoshi-medium">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-satoshi">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-satoshi-semibold text-gray-900">AI Superconnector Content</h2>
          <p className="text-gray-600 mt-2 font-satoshi-regular">
            Generate, manage, and schedule AI-powered content for your brand
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generateNewContent('varied')} className="bg-cyan-600 hover:bg-cyan-700 text-white font-satoshi-semibold">
            Generate Varied Content
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <div className="text-red-500">⚠️</div>
              <div>
                <p className="font-satoshi-semibold">Error loading dashboard data</p>
                <p className="text-sm text-red-600 font-satoshi-regular">{error}</p>
              </div>
              <Button 
                onClick={fetchDashboardData} 
                variant="outline" 
                size="sm"
                className="ml-auto border-red-200 text-red-700 hover:bg-red-100 font-satoshi-medium"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid - Matching Always Listening Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Content Creation Form */}
        <div className="md:col-span-1">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-satoshi-semibold text-gray-900">Content Creation</CardTitle>
              <CardDescription className="text-gray-600 font-satoshi-regular">
                Generate AI-powered content for your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="contentType" className="text-sm font-satoshi-medium text-gray-900">Content Type</Label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-satoshi-regular"
                >
                  <option value="varied">🎲 Varied Content</option>
                  <option value="networking_tips">🤝 Networking Tips</option>
                  <option value="ai_insights">🧠 AI Superconnector</option>
                  <option value="startup_humor">😄 Founder Humor</option>
                </select>
              </div>

              {/* Context Input */}
              <div className="space-y-2">
                <Label htmlFor="context" className="text-sm font-satoshi-medium text-gray-900">Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide additional context or specific requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-satoshi-regular"
                />
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                    <Label htmlFor="engagementPrompt" className="text-sm font-satoshi-medium text-gray-700">Include engagement prompt</Label>
                  </div>
                  <Switch
                    id="engagementPrompt"
                    checked={includeEngagementPrompt}
                    onCheckedChange={setIncludeEngagementPrompt}
                    className="data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-gray-300 h-7 w-14"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                    <Label htmlFor="followUp" className="text-sm font-satoshi-medium text-gray-700">Include follow-up content</Label>
                  </div>
                  <Switch
                    id="followUp"
                    checked={includeFollowUp}
                    onCheckedChange={setIncludeFollowUp}
                    className="data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-gray-300 h-7 w-14"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={() => generateNewContent(contentType)} 
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-satoshi-semibold"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </Button>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md font-satoshi-regular">{error}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content Management */}
        <div className="md:col-span-2">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-satoshi-semibold text-gray-900">Content Management</CardTitle>
              <CardDescription className="text-gray-600 font-satoshi-regular">
                Review, edit, and schedule your generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Content Preview Section */}
              {selectedContent ? (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-satoshi-semibold text-gray-900 mb-2">Generated Content:</h4>
                    <p className="text-sm text-gray-700 mb-3 font-satoshi-regular">{selectedContent.content}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      {selectedContent.hashtags?.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-gray-200 text-gray-700 font-satoshi-medium">
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
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-satoshi-semibold"
                    >
                      Edit & Customize
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 font-satoshi-medium"
                    >
                      Schedule Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm font-satoshi-regular">Generate content to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
