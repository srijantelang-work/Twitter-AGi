"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit3, Send, ThumbsUp, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useDashboardData } from "@/contexts/DashboardDataContext"
import { useState } from "react"
import { ResponseStatus } from "@/types/database"

type Suggestion = {
  id: string
  source: string
  original: string
  draft: string
  tags: string[]
  status: ResponseStatus
}

export function ReplyQueue() {
  const { responses, tweets } = useDashboardData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Transform responses to suggestions
  const suggestions: Suggestion[] = responses.data.map(response => {
    const tweet = tweets.data.find(t => t.id === response.tweet_id);
    return {
      id: response.id,
      source: tweet ? tweet.handle : 'Unknown',
      original: tweet ? tweet.text : 'No content',
      draft: response.content,
      tags: [response.intent, response.status],
      status: response.status
    };
  });

  const handleApprove = async (id: string) => {
    try {
      await responses.approveResponse(id);
    } catch (error) {
      console.error('Failed to approve response:', error);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    if (!drafts[id]) {
      const suggestion = suggestions.find(s => s.id === id);
      if (suggestion) {
        setDrafts(prev => ({ ...prev, [id]: suggestion.draft }));
      }
    }
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    // Here you could update the response in the backend
    console.log('Saving edit for response:', id, drafts[id]);
  };

  const handleRefresh = () => {
    responses.refresh();
  };

  if (responses.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggested Replies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-md border p-3 animate-pulse">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-20 w-full bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (responses.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggested Replies</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load responses: {responses.error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Suggested Replies ({suggestions.length})</CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh}
          disabled={responses.loading}
        >
          {responses.loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Edit3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No suggested replies yet</p>
            <p className="text-sm">AI-generated responses will appear here for your review</p>
          </div>
        ) : (
          suggestions.map((s) => (
            <section key={s.id} aria-label="Suggested reply" className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">Source:</span> <span className="font-medium">{s.source}</span>
                </div>
                <div className="flex gap-2">
                  {s.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <p className="mt-2 text-sm leading-relaxed">
                <span className="text-muted-foreground">Original: </span>
                {s.original}
              </p>

              <Separator className="my-3" />

              <div className="space-y-2">
                <label htmlFor={`draft-${s.id}`} className="text-xs font-medium">
                  Draft reply
                </label>
                {editingId === s.id ? (
                  <div className="space-y-2">
                    <Textarea 
                      id={`draft-${s.id}`} 
                      value={drafts[s.id] || s.draft}
                      onChange={(e) => setDrafts(prev => ({ ...prev, [s.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(s.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea id={`draft-${s.id}`} value={s.draft} readOnly />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleEdit(s.id)}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  {editingId === s.id ? 'Save' : 'Edit'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleApprove(s.id)}
                  disabled={s.status === 'approved'}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {s.status === 'approved' ? 'Approved' : 'Approve'}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={s.status !== 'approved'}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </Button>
                <span className="ml-auto text-xs text-amber-600">Preview before posting.</span>
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  )
}
