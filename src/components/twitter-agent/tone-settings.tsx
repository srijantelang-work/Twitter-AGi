"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Settings, Clock, Shield, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function ToneSettings({ className }: { className?: string }) {
  return (
    <Card className={cn(className, "bg-white border-gray-200 shadow-sm")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Settings className="h-5 w-5 text-cyan-600" />
          Tone & Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-600" />
              <Label className="text-gray-900">Playfulness</Label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                Slightly witty and friendly; keep responses natural and non-robotic.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="playful-recommended"
                  name="playfulness"
                  value="recommended"
                  defaultChecked
                  className="text-cyan-600 focus:ring-cyan-600"
                />
                <Label htmlFor="playful-recommended" className="text-sm text-gray-700">Recommended</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-600" />
              <Label className="text-gray-900">Safety Guardrails</Label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                Avoid spammy behavior, sensitive topics, or unsolicited tagging.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="safety-recommended"
                  name="safety"
                  value="recommended"
                  defaultChecked
                  className="text-cyan-600 focus:ring-cyan-600"
                />
                <Label htmlFor="safety-recommended" className="text-sm text-gray-700">Recommended</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-cyan-600" />
              <Label className="text-gray-900">Helpful Bias</Label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                Prioritize introductions and actionable help in replies.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="helpful-recommended"
                  name="helpful"
                  value="recommended"
                  defaultChecked
                  className="text-cyan-600 focus:ring-cyan-600"
                />
                <Label htmlFor="helpful-recommended" className="text-sm text-gray-700">Recommended</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-600" />
              <Label className="text-gray-900">Engagement Cadence</Label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                Controls reply frequency to stay helpful without overwhelming.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="cadence-recommended"
                  name="cadence"
                  value="recommended"
                  defaultChecked
                  className="text-cyan-600 focus:ring-cyan-600"
                />
                <Label htmlFor="cadence-recommended" className="text-sm text-gray-700">Recommended</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            These settings help maintain the AI agent&apos;s personality and ensure it stays within safe, helpful boundaries while engaging with your community.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
