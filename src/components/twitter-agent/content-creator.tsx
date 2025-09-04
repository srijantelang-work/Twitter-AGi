'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { AIResponse } from '@/types/ai'

interface ContentSuggestion {
  suggestionId: number
  contentType: string
  content: AIResponse
}

interface ContentCreatorProps {
  onContentCreated?: (content: AIResponse) => void
  onClose?: () => void
}

export default function ContentCreator({ onContentCreated, onClose }: ContentCreatorProps) {
  const [activeTab, setActiveTab] = useState('generate')
  const [contentType, setContentType] = useState('varied')
  const [context, setContext] = useState('')
  const [includeEngagementPrompt, setIncludeEngagementPrompt] = useState(true)
  const [includeFollowUp, setIncludeFollowUp] = useState(false)
  const [suggestionLimit, setSuggestionLimit] = useState(3)
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])
  const [selectedContent, setSelectedContent] = useState<AIResponse | null>(null)
  const [customContent, setCustomContent] = useState('')
  const [customHashtags, setCustomHashtags] = useState('')
  const [customEmojis, setCustomEmojis] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [postingTimeSlot, setPostingTimeSlot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contentTypes = [
    { value: 'varied', label: 'Varied Content', icon: '🎲', description: 'AI-generated diverse content mix' },
    { value: 'networking_tips', label: 'Networking Tips', icon: '🤝', description: 'Professional networking advice and strategies' },
    { value: 'ai_insights', label: 'AI Insights', icon: '🧠', description: 'AI trends and industry insights' },
    { value: 'startup_humor', label: 'Startup Humor', icon: '😄', description: 'Founder-friendly humor and memes' },
    { value: 'community_building', label: 'Community Building', icon: '👥', description: 'Strategies for building communities' },
    { value: 'connection_stories', label: 'Connection Stories', icon: '📖', description: 'Success stories and case studies' },
    { value: 'tech_trends', label: 'Tech Trends', icon: '🚀', description: 'Emerging technology trends' }
  ]

  const timeSlots = [
    '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'
  ]

  const generateContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai/autonomous-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          context: context || `Generate ${contentType} content for the AI Superconnector brand`,
          includeEngagementPrompt,
          includeFollowUp
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSelectedContent(data.data.content)
        setCustomContent(data.data.content.content || '')
        setCustomHashtags(data.data.content.hashtags?.join(', ') || '')
        setCustomEmojis(data.data.content.emojis?.join(' ') || '')
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

  const getContentSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ai/autonomous-content/generate?type=${contentType}&limit=${suggestionLimit}`)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.data.suggestions || [])
      } else {
        setError(data.error || 'Failed to get suggestions')
      }
    } catch (error) {
      setError('Failed to get suggestions')
      console.error('Error getting suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectSuggestion = (suggestion: ContentSuggestion) => {
    setSelectedContent(suggestion.content)
    setCustomContent(suggestion.content.content || '')
    setCustomHashtags(suggestion.content.hashtags?.join(', ') || '')
    setCustomEmojis(suggestion.content.emojis?.join(' ') || '')
  }

  const scheduleContent = async () => {
    try {
      if (!customContent.trim()) {
        setError('Content is required')
        return
      }

      setLoading(true)
      setError(null)

      // Create content record
      const contentResponse = await fetch('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: customContent,
          contentType: contentType === 'varied' ? 'mixed' : contentType,
          hashtags: customHashtags.split(',').map(tag => tag.trim()).filter(Boolean),
          emojis: customEmojis.split(' ').filter(Boolean),
          scheduledAt: scheduledAt || undefined,
          postingTimeSlot: postingTimeSlot || undefined
        })
      })

      const contentData = await contentResponse.json()
      
      if (contentData.success) {
        // Schedule content if date/time provided
        if (scheduledAt && postingTimeSlot) {
          const scheduleResponse = await fetch('/api/content/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: contentData.data.id,
              userId: 'current', // This should come from auth context
              scheduledAt,
              postingTimeSlot,
              timezone: 'UTC'
            })
          })

          const scheduleData = await scheduleResponse.json()
          
          if (!scheduleData.success) {
            setError('Content created but scheduling failed')
            return
          }
        }

        onContentCreated?.(contentData.data)
        setError(null)
      } else {
        setError(contentData.error || 'Failed to create content')
      }
    } catch (error) {
      setError('Failed to create content')
      console.error('Error creating content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getContentTypeIcon = (type: string) => {
    const contentType = contentTypes.find(ct => ct.value === type)
    return contentType?.icon || '📝'
  }

  const getContentTypeLabel = (type: string) => {
    const contentType = contentTypes.find(ct => ct.value === type)
    return contentType?.label || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Creator</h2>
          <p className="text-muted-foreground">
            Create and customize AI-generated content for the AI Superconnector brand
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate AI Content</CardTitle>
              <CardDescription>
                Use AI to generate content based on your specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {contentTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={contentType === type.value ? 'default' : 'outline'}
                      className="h-auto p-3 flex-col space-y-2"
                      onClick={() => setContentType(type.value)}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {type.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide additional context or specific requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="engagementPrompt"
                    checked={includeEngagementPrompt}
                    onCheckedChange={setIncludeEngagementPrompt}
                  />
                  <Label htmlFor="engagementPrompt">Include engagement prompt</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="followUp"
                    checked={includeFollowUp}
                    onCheckedChange={setIncludeFollowUp}
                  />
                  <Label htmlFor="followUp">Include follow-up content</Label>
                </div>
              </div>

              <Button 
                onClick={generateContent} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </Button>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              {selectedContent && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Generated Content:</h4>
                  <p className="text-sm mb-2">{selectedContent.content}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {selectedContent.hashtags?.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                    {selectedContent.emojis?.map((emoji: string, index: number) => (
                      <span key={index}>{emoji}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Suggestions</CardTitle>
              <CardDescription>
                Get multiple AI-generated content suggestions to choose from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="suggestionType">Content Type</Label>
                  <select
                    id="suggestionType"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {contentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestionLimit">Number of Suggestions</Label>
                  <Input
                    id="suggestionLimit"
                    type="number"
                    min="1"
                    max="10"
                    value={suggestionLimit}
                    onChange={(e) => setSuggestionLimit(parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>

              <Button 
                onClick={getContentSuggestions} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Getting Suggestions...' : 'Get Suggestions'}
              </Button>

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Suggestions:</h4>
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.suggestionId}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getContentTypeIcon(suggestion.contentType)}</span>
                        <Badge variant="outline">
                          {getContentTypeLabel(suggestion.contentType)}
                        </Badge>
                        <Badge variant="secondary">#{suggestion.suggestionId}</Badge>
                      </div>
                      <p className="text-sm">{suggestion.content.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customize Content</CardTitle>
              <CardDescription>
                Edit and customize the generated content before scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customContent">Content</Label>
                <Textarea
                  id="customContent"
                  placeholder="Enter your content here..."
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={4}
                  maxLength={280}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {customContent.length}/280 characters
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customHashtags">Hashtags (comma-separated)</Label>
                  <Input
                    id="customHashtags"
                    placeholder="#networking, #startup, #ai"
                    value={customHashtags}
                    onChange={(e) => setCustomHashtags(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEmojis">Emojis (space-separated)</Label>
                  <Input
                    id="customEmojis"
                    placeholder="🤝 🚀 💡"
                    value={customEmojis}
                    onChange={(e) => setCustomEmojis(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>💡 Tip: Keep hashtags relevant and limit to 2-3 per post for better engagement.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Content</CardTitle>
              <CardDescription>
                Set when and how your content will be posted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date</Label>
                  <Input
                    id="scheduledAt"
                    type="date"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postingTimeSlot">Time Slot</Label>
                  <select
                    id="postingTimeSlot"
                    value={postingTimeSlot}
                    onChange={(e) => setPostingTimeSlot(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select time slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>📅 Optimal posting times are automatically calculated based on your audience engagement patterns.</p>
              </div>

              <Button 
                onClick={scheduleContent} 
                disabled={loading || !customContent.trim()}
                className="w-full"
              >
                {loading ? 'Scheduling...' : 'Schedule Content'}
              </Button>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
