"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, Sparkles, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { useDashboardData } from "@/contexts/DashboardDataContext"
import { useState } from "react"
import { ContentSchedule, ContentType } from "@/types/database"

type Scheduled = {
  id: string
  when: string
  category: string
  text: string
  status: string
}

export function ContentScheduler() {
  const { content } = useDashboardData();
  const [newContent, setNewContent] = useState({
    content: '',
    category: '',
    scheduled_time: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Transform content data to scheduled items
  const queue: Scheduled[] = content.data.map((item: ContentSchedule) => ({
    id: item.id,
    when: item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'Not scheduled',
    category: item.content_type || 'General',
    text: item.content,
    status: item.status
  }));

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.content || !newContent.scheduled_time) return;

    setIsCreating(true);
    try {
      await content.addContent({
        content: newContent.content,
        content_type: (newContent.category || 'tweet') as ContentType,
        scheduled_at: new Date(newContent.scheduled_time).toISOString(),
        status: 'draft'
      });
      
      // Reset form
      setNewContent({ content: '', category: '', scheduled_time: '' });
    } catch (error) {
      console.error('Failed to create content:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      await content.deleteContent(id);
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  if (content.loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Clock className="h-5 w-5 text-cyan-600" />
            Content & Shitposts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-gray-200 p-4 animate-pulse bg-gray-50">
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (content.error) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Clock className="h-5 w-5 text-cyan-600" />
            Content & Shitposts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load content: {content.error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Clock className="h-5 w-5 text-cyan-600" />
          Content & Shitposts
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>🟢 {queue.length} items</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleCreateContent} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-gray-700">Post content</Label>
              <Textarea 
                id="content" 
                placeholder="Draft a witty post about the AI superconnector…"
                value={newContent.content}
                onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                required
                className="border-gray-200 focus:border-cyan-600 focus:ring-cyan-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700">Category</Label>
              <Input 
                id="category" 
                placeholder="Superconnector / Powers / Humor"
                value={newContent.category}
                onChange={(e) => setNewContent(prev => ({ ...prev, category: e.target.value }))}
                className="border-gray-200 focus:border-cyan-600 focus:ring-cyan-600"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="when" className="text-gray-700">Schedule (local time)</Label>
            <Input 
              id="when" 
              type="datetime-local"
              value={newContent.scheduled_time}
              onChange={(e) => setNewContent(prev => ({ ...prev, scheduled_time: e.target.value }))}
              required
              className="border-gray-200 focus:border-cyan-600 focus:ring-cyan-600"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Keep it human: conversational, playful, and helpful—never spammy.
            </p>
            <Button 
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Schedule Post
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Content</h3>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No scheduled content yet</p>
              <p className="text-sm">Create your first post to get started</p>
            </div>
          ) : (
            queue.map((q) => (
              <article key={q.id} className="rounded-md border border-gray-200 p-4 bg-gray-50">
                <header className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{q.text}</h4>
                    <p className="text-sm text-gray-500">{q.category} • {q.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={q.status === 'published' ? 'default' : q.status === 'scheduled' ? 'secondary' : 'outline'}
                      className={q.status === 'published' ? 'bg-cyan-600' : q.status === 'scheduled' ? 'bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-700'}
                    >
                      {q.status}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteContent(q.id)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </header>
                <p className="text-sm text-gray-700 mb-3">{q.text}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Scheduled: {q.when}</span>
                  <span>Created: {new Date(q.id).toLocaleDateString()}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
