"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Funnel, X, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { IntentFilter } from "@/lib/database/intent-filters"
import { Tone } from "@/lib/ai/reply-generator"

const TONES: Record<string, { name: string; description: string }> = {
  HELPFUL: { name: 'Helpful', description: 'Genuine assistance and value' },
  WITTY: { name: 'Witty', description: 'Clever humor and wordplay' },
  PLAYFUL: { name: 'Playful', description: 'Fun and lighthearted interaction' },
  CONFIDENT: { name: 'Confident', description: 'Assured and authoritative tone' },
  THOUGHTFUL: { name: 'Thoughtful', description: 'Reflective and insightful commentary' }
}

interface IntentFiltersProps {
  className?: string
  selectedTone?: Tone
  onToneChange?: (tone: Tone) => void
}

export function IntentFilters({ className, selectedTone = 'HELPFUL', onToneChange }: IntentFiltersProps) {
  const [newKeyword, setNewKeyword] = useState("")
  const [filters, setFilters] = useState<IntentFilter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch filters on component mount
  useEffect(() => {
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/intent-filters')
      if (!response.ok) {
        throw new Error('Failed to fetch filters')
      }
      
      const data = await response.json()
      setFilters(data.filters || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filters')
      console.error('Error fetching filters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/intent-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add filter')
      }
      
      const data = await response.json()
      setFilters(data.filters || [])
      setNewKeyword("")
      
      console.log('✅ Filter added successfully:', data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add filter')
      console.error('Error adding filter:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveKeyword = async (filterId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/intent-filters/${filterId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove filter')
      }
      
      // Refresh filters after removal
      await fetchFilters()
      
      console.log('✅ Filter removed successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove filter')
      console.error('Error removing filter:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToneChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTone = event.target.value as Tone
    if (onToneChange) {
      onToneChange(newTone)
    }
  }

  const keywordExists = (keyword: string) => {
    return filters.some(filter => filter.keyword.toLowerCase() === keyword.toLowerCase())
  }

  return (
    <div className="space-y-6">
      {/* Intent Filters Card */}
      <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Funnel className="h-5 w-5 text-cyan-600" />
            Intent Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="text-gray-700">Add keyword or phrase</Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                placeholder="e.g. 'need a designer'"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="border-gray-200 focus:border-cyan-600 focus:ring-cyan-600"
              />
              <Button 
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim() || loading || keywordExists(newKeyword.trim())}
                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {keywordExists(newKeyword.trim()) ? 'Already Added' : 'Add'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700">Active Filters</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading filters...</span>
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Badge
                    key={filter.id}
                    variant="outline"
                    className="border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 cursor-pointer"
                    onClick={() => handleRemoveKeyword(filter.id)}
                  >
                    {filter.keyword}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 leading-relaxed">
            These phrases help the agent detect help/intro/connect signals. 
            The AI will monitor Twitter for tweets containing these keywords and phrases.
          </div>
        </CardContent>
      </Card>

      {/* AI Reply Tone Card */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            AI Reply Tone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="tone" className="text-gray-700">Select tone for AI replies</Label>
            <select
              id="tone"
              value={selectedTone}
              onChange={handleToneChange}
              className="w-full p-3 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
            >
              {Object.entries(TONES).map(([key, tone]) => (
                <option key={key} value={key}>
                  {tone.name} - {tone.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Selected: <strong>{TONES[selectedTone].name}</strong> - {TONES[selectedTone].description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
