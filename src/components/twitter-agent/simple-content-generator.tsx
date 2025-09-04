'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Sparkles, FileText } from 'lucide-react'

interface GeneratedContent {
  id: string
  content: string
  contentType: string
  context: string
  hashtags: string[]
  emojis: string[]
  createdAt: string
  status: 'draft' | 'approved' | 'scheduled'
}

export default function SimpleContentGenerator() {
  const { user } = useAuth()
  const [contentType, setContentType] = useState('varied')
  const [context, setContext] = useState('')
  const [includeEngagementPrompt, setIncludeEngagementPrompt] = useState(true)
  const [includeFollowUp, setIncludeFollowUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null)

  const generateContent = async () => {
    if (!user) {
      setError('Please log in to generate content')
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
          contentType,
          context: context || `Generate ${contentType} content for the AI Superconnector brand`,
          includeEngagementPrompt,
          includeFollowUp
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const newContent: GeneratedContent = {
          id: Date.now().toString(),
          content: data.data.content.content || 'Generated content',
          contentType,
          context: context || 'Default context',
          hashtags: data.data.content.hashtags || [],
          emojis: data.data.content.emojis || [],
          createdAt: new Date().toISOString(),
          status: 'draft'
        }
        
        setGeneratedContents(prev => [newContent, ...prev])
        setSelectedContent(newContent)
        setError(null)
        
        // Clear form
        setContext('')
      } else {
        setError(data.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const updateContentStatus = (id: string, status: 'draft' | 'approved' | 'scheduled') => {
    setGeneratedContents(prev => 
      prev.map(content => 
        content.id === id ? { ...content, status } : content
      )
    )
    
    if (selectedContent?.id === id) {
      setSelectedContent(prev => prev ? { ...prev, status } : null)
    }
  }

  const deleteContent = (id: string) => {
    setGeneratedContents(prev => prev.filter(content => content.id !== id))
    
    if (selectedContent?.id === id) {
      setSelectedContent(null)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-lg text-gray-600">Please log in to access content generation</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">AI Content Generator</h2>
          <p className="text-gray-600 mt-2">
            Generate AI-powered content for your brand - Simple, Fast, Effective
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Total Generated: {generatedContents.length}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <div className="text-red-500">⚠️</div>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button 
                onClick={() => setError(null)} 
                variant="outline" 
                size="sm"
                className="ml-auto border-red-200 text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Content Creation Form */}
        <div className="md:col-span-1">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Sparkles className="h-5 w-5 text-cyan-600" />
                Content Creation
              </CardTitle>
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
                  <option value="ai_insights">🧠 AI Superconnector</option>
                  <option value="startup_humor">😄 Founder Humor</option>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                    <Label htmlFor="engagementPrompt" className="text-sm font-medium text-gray-700">Include engagement prompt</Label>
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
                    <Label htmlFor="followUp" className="text-sm font-medium text-gray-700">Include follow-up content</Label>
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
                onClick={generateContent} 
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content Management */}
        <div className="md:col-span-2">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-cyan-600" />
                Generated Content
              </CardTitle>
              <CardDescription className="text-gray-600">
                Review and manage your generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContents.length > 0 ? (
                <div className="space-y-4">
                  {generatedContents.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.contentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <Badge 
                              variant={item.status === 'approved' ? 'default' : item.status === 'scheduled' ? 'secondary' : 'outline'} 
                              className="text-xs"
                            >
                              {item.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3 mb-2">{item.content}</p>
                          {item.hashtags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mb-2">
                              {item.hashtags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {item.context && (
                            <p className="text-xs text-gray-500 italic">
                              Context: {item.context}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedContent(item)}
                            className="w-full sm:w-auto"
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateContentStatus(item.id, 'approved')}
                            className={`w-full sm:w-auto ${item.status === 'approved' ? 'bg-green-100 border-green-300' : ''}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteContent(item.id)}
                            className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm">No content generated yet. Use the form on the left to create your first piece.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Preview Modal */}
      {selectedContent && (
        <Card className="border border-gray-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Content Preview</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedContent(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">Generated Content:</h4>
                <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{selectedContent.content}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  {selectedContent.hashtags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-gray-200 text-gray-700">
                      #{tag}
                    </Badge>
                  ))}
                  {selectedContent.emojis?.map((emoji: string, index: number) => (
                    <span key={index}>{emoji}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => updateContentStatus(selectedContent.id, 'approved')}
                >
                  Approve Content
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => updateContentStatus(selectedContent.id, 'scheduled')}
                >
                  Mark as Scheduled
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    deleteContent(selectedContent.id)
                    setSelectedContent(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
