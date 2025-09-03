"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ReplySuggestion } from '@/lib/ai/reply-generator'
import { cn } from '@/lib/utils'

interface ReplySuggestionsProps {
  suggestions: ReplySuggestion[]
  tone: string
  tweetId: string
  onRegenerate?: () => void
  isLoading?: boolean
  className?: string
}

export function ReplySuggestions({
  suggestions,
  tone,
  tweetId,
  onRegenerate,
  isLoading = false,
  className
}: ReplySuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getToneColor = (tone: string) => {
    const toneColors: Record<string, string> = {
      'Helpful': 'bg-blue-100 text-blue-800 border-blue-200',
      'Witty': 'bg-purple-100 text-purple-800 border-purple-200',
      'Playful': 'bg-pink-100 text-pink-800 border-pink-200',
      'Confident': 'bg-green-100 text-green-800 border-green-200',
      'Thoughtful': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
    return toneColors[tone] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getCharacterCountColor = (count: number) => {
    if (count <= 200) return 'text-green-600'
    if (count <= 250) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
            Generating Reply Suggestions...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-gray-200 p-4 animate-pulse bg-gray-50">
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No reply suggestions available</p>
          <p className="text-sm text-gray-500 mt-2">Try selecting a different tone or regenerating</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <CheckCircle className="h-5 w-5 text-green-600" />
          AI Reply Suggestions
          <Badge 
            variant="outline" 
            className={cn("ml-2", getToneColor(tone))}
          >
            {tone}
          </Badge>
        </CardTitle>
        {onRegenerate && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRegenerate}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
          <strong>Generated for:</strong> Tweet {tweetId.slice(-8)} • {suggestions.length} suggestions
        </div>

        {suggestions.map((suggestion, index) => (
          <div 
            key={index} 
            className={cn(
              "rounded-md border p-4 transition-all duration-200",
              suggestion.isAppropriate 
                ? "border-gray-200 bg-gray-50 hover:bg-gray-100" 
                : "border-red-200 bg-red-50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <p className="text-sm leading-relaxed text-gray-700">
                  {suggestion.content}
                </p>
                
                {suggestion.reasoning && (
                  <p className="text-xs text-gray-500 italic">
                    💡 {suggestion.reasoning}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-mono",
                    getCharacterCountColor(suggestion.characterCount)
                  )}>
                    {suggestion.characterCount}/280 chars
                  </span>
                  
                  {!suggestion.isAppropriate && (
                    <Badge variant="destructive" className="text-xs">
                      Inappropriate
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(suggestion.content, index)}
                className={cn(
                  "border-gray-200 text-gray-700 hover:bg-gray-100 transition-all",
                  copiedIndex === index && "border-green-500 text-green-700 bg-green-50"
                )}
              >
                {copiedIndex === index ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border border-blue-200">
          <strong>💡 Tip:</strong> Click &quot;Copy&quot; to copy any suggestion to your clipboard. 
          You can then paste it directly into Twitter or modify it as needed.
        </div>
      </CardContent>
    </Card>
  )
}
