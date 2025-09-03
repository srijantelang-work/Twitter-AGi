"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  ArrowLeft,
  Twitter
} from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()

  const handleTwitterLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Initiating Twitter OAuth login...')
      await signIn('twitter')
      console.log('✅ Twitter OAuth initiated successfully')
      // The OAuth flow will handle the redirect
    } catch (error) {
      console.error('❌ Twitter login error:', error)
      setError(error instanceof Error ? error.message : 'Failed to initiate Twitter login')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for OAuth errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const oauthError = urlParams.get('error')
    const errorDetails = urlParams.get('details')
    
    if (oauthError) {
      console.error('🔴 OAuth error detected:', { oauthError, errorDetails })
      setError(`OAuth Error: ${errorDetails || oauthError}`)
      
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center">
                  <Bot className="h-8 w-8 text-cyan-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <p className="text-gray-600">Sign in to your AI Twitter Agent dashboard</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleTwitterLogin}
                  className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white flex items-center justify-center gap-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      <Twitter className="h-5 w-5" />
                      Sign in with Twitter
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    By signing in, you agree to our{" "}
                    <Link href="/terms" className="text-cyan-600 hover:text-cyan-700 font-medium">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-cyan-600 hover:text-cyan-700 font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Features & Benefits */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transform Your Twitter Presence with AI
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Join hundreds of founders, creators, and community builders who are already using our AI agent 
              to scale their impact and never miss a connection opportunity.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Always Listening</h3>
                <p className="text-gray-600 text-sm">
                  Our AI continuously monitors Twitter for help requests, intro opportunities, and connection signals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Engagement</h3>
                <p className="text-gray-600 text-sm">
                  Generate human-like responses that maintain your authentic voice while scaling your engagement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">24×7 Availability</h3>
                <p className="text-gray-600 text-sm">
                  Never miss an opportunity to help or connect, even when you&apos;re offline or busy building.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h4 className="font-semibold text-gray-900 mb-4">What users are saying</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-cyan-700">S</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    &ldquo;This AI agent has helped me connect with 3x more founders in just 2 weeks. Game changer!&rdquo;
                  </p>
                  <p className="text-xs text-gray-500 mt-1">— Sarah Chen, Founder</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700">M</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    &ldquo;Finally, I can focus on building while staying engaged with my community. The AI is incredibly smart.&rdquo;
                  </p>
                  <p className="text-xs text-gray-500 mt-1">— Mike Rodriguez, Creator</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="text-sm text-gray-500">
              Trusted by 500+ creators and founders
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
