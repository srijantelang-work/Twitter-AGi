"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TwitterButton from "@/components/ui/twitter-button"
import RobotLoader from "@/components/ui/robot-loader"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Sparkles, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle,
  Bot,
  Brain,
  Calendar,
  BarChart3,
  LogOut,
  User
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const { user, loading, signIn, signOut, isAuthenticated } = useAuth()
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false)

  // Reset OAuth progress when auth state changes
  useEffect(() => {
    if (isAuthenticated && isOAuthInProgress) {
      setIsOAuthInProgress(false)
    }
  }, [isAuthenticated, isOAuthInProgress])

  const handleTwitterAuth = async () => {
    try {
      setIsOAuthInProgress(true)
      await signIn('twitter')
    } catch (error) {
      console.error('Failed to initiate Twitter OAuth:', error)
      setIsOAuthInProgress(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  // Show robot loader during OAuth process
  if (isOAuthInProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <RobotLoader />
          <p className="text-gray-600 font-satoshi-medium mt-6 text-lg">
            Connecting to Twitter...
          </p>
          <p className="text-gray-500 font-satoshi-regular mt-2 text-sm">
            Please complete the authentication in the new window
          </p>
        </div>
      </div>
    )
  }

  // Show simple loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 text-cyan-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 font-satoshi-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 font-satoshi">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-cyan-600" />
              <span className="text-xl font-satoshi-bold text-gray-900">AI Twitter Agent</span>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-satoshi-medium">
                      @{user?.user_metadata?.twitter_username || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-satoshi-medium transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                  <Link href="/dashboard">
                    <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-satoshi-medium transition-colors">
                      Dashboard
                    </button>
                  </Link>
                </>
              ) : (
                <button onClick={handleTwitterAuth}>
                  <TwitterButton />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200 shadow-sm font-satoshi-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 shadow-sm font-satoshi-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-satoshi-black text-gray-900 mb-6 leading-tight">

            <span className="text-cyan-600"> Twitter Superconnector</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-satoshi-regular">
            Automatically detect help requests, generate AI-powered replies, and create engaging content. 
            Never miss an opportunity to connect and help your community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-4 rounded-lg shadow-lg font-satoshi-bold transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <button onClick={handleTwitterAuth}>
                <TwitterButton />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-satoshi-bold text-gray-900 mb-4">
              Supercharge Your Twitter Engagement
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-satoshi-regular">
              Three powerful tools in one platform to make your Twitter presence unstoppable
            </p>
          </div>

          <Tabs defaultValue="listen" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-12 shadow-md">
              <TabsTrigger value="listen" className="flex items-center gap-2 font-satoshi-medium">
                <MessageSquare className="h-4 w-4" />
                Always Listening
              </TabsTrigger>
              <TabsTrigger value="engage" className="flex items-center gap-2 font-satoshi-medium">
                <Brain className="h-4 w-4" />
                AI Reply Generator
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2 font-satoshi-medium">
                <Calendar className="h-4 w-4" />
                Content Creator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listen" className="mt-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-satoshi-bold text-gray-900 mb-4">
                    Never Miss an Opportunity
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed font-satoshi-regular">
                    Our AI continuously monitors Twitter for intent signals like &ldquo;looking for&rdquo;, &ldquo;anyone know&rdquo;, 
                    &ldquo;recommend&rdquo;, and &ldquo;intro to&rdquo;. When it detects someone who needs help or wants to connect, 
                    you&apos;ll know instantly.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Real-time intent detection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Customizable keyword filters</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Smart categorization and tagging</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Live monitoring dashboard</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-2xl shadow-xl">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-satoshi-semibold text-cyan-700">MP</span>
                        </div>
                        <div>
                          <p className="font-satoshi-semibold text-sm">Maya Patel</p>
                          <p className="text-xs text-gray-500 font-satoshi-regular">@mayap • 4m</p>
                        </div>
                      </div>
                      <p className="text-sm font-satoshi-regular">Anyone know a good AI scheduling tool that handles time zones well?</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs shadow-sm font-satoshi-medium">tools</Badge>
                        <Badge variant="outline" className="text-xs shadow-sm font-satoshi-medium">help</Badge>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-satoshi-semibold text-blue-700">LC</span>
                        </div>
                        <div>
                          <p className="font-satoshi-semibold text-sm">Leo Chen</p>
                          <p className="text-xs text-gray-500 font-satoshi-regular">@leochen • 12m</p>
                        </div>
                      </div>
                      <p className="text-sm font-satoshi-regular">Visiting SF this week—would love to meet fellow founders for coffee.</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs shadow-sm font-satoshi-medium">meetups</Badge>
                        <Badge variant="outline" className="text-xs shadow-sm font-satoshi-medium">intros</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="engage" className="mt-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-xl">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100 border-l-4 border-green-500">
                        <div className="text-xs text-gray-500 mb-2 font-satoshi-medium">AI Reply Suggestion</div>
                        <p className="text-sm mb-3 font-satoshi-regular">&ldquo;I know a solid one&mdash;&apos;ChronoPilot&apos;. Happy to intro you to the founder if you want a fast tour. Want me to connect?&rdquo;</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 shadow-sm font-satoshi-medium">helpful</Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 shadow-sm font-satoshi-medium">intro-ready</Badge>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                        <div className="text-xs text-gray-500 mb-2 font-satoshi-medium">Tone: Helpful • 156/280 chars</div>
                        <p className="text-sm font-satoshi-regular">&ldquo;Check out &apos;TimeZonePro&apos; - it&apos;s been a game-changer for our remote team.&rdquo;</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl font-satoshi-bold text-gray-900 mb-4">
                    AI-Generated, Human-Approved
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed font-satoshi-regular">
                    Our AI analyzes the context and generates natural, helpful replies in multiple tones. 
                    Choose from Helpful, Witty, Playful, Confident, or Thoughtful responses that sound like 
                    they came from a real person.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Multiple tone options</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Context-aware responses</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">One-click copy to clipboard</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Character count validation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create" className="mt-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-satoshi-bold text-gray-900 mb-4">
                    AI Content Generation
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed font-satoshi-regular">
                    Generate engaging content for your brand with AI assistance. Create varied content types 
                    including networking tips, AI insights, startup humor, and community building posts.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Multiple content types</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Customizable context</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Engagement prompts</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-satoshi-medium">Content scheduling</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-xl">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 shadow-sm font-satoshi-medium">Networking Tips</Badge>
                        <span className="text-xs text-gray-500 font-satoshi-regular">Ready to post</span>
                      </div>
                      <p className="text-sm font-satoshi-regular">Pro tip: Always follow up within 24 hours after meeting someone. It&apos;s the difference between a contact and a connection.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-pink-50 text-pink-700 shadow-sm font-satoshi-medium">Startup Humor</Badge>
                        <span className="text-xs text-gray-500 font-satoshi-regular">Scheduled</span>
                      </div>
                      <p className="text-sm font-satoshi-regular">Founders: &apos;We need distribution.&apos; AI: &apos;What if I just befriended the internet?&apos;</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-satoshi-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-satoshi-regular">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-satoshi-semibold text-gray-900 mb-2">1. Connect Your Twitter</h3>
              <p className="text-gray-600 font-satoshi-regular">Authenticate with Twitter OAuth and set up your intent filters</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Brain className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-satoshi-semibold text-gray-900 mb-2">2. AI Monitors & Generates</h3>
              <p className="text-gray-600 font-satoshi-regular">Our AI detects opportunities and generates personalized replies</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-satoshi-semibold text-gray-900 mb-2">3. Engage & Grow</h3>
              <p className="text-gray-600 font-satoshi-regular">Review, approve, and send replies to build meaningful connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-satoshi-bold text-gray-900 mb-6">
            Ready to Transform Your Twitter Game?
          </h2>
          <p className="text-xl text-gray-600 mb-8 font-satoshi-regular">
            Join hundreds of founders, creators, and community builders who are already using AI to scale their impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-4 rounded-lg shadow-lg font-satoshi-bold transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <button onClick={handleTwitterAuth}>
                <TwitterButton />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-cyan-400" />
                <span className="text-lg font-satoshi-bold">AI Twitter Agent</span>
              </div>
              <p className="text-gray-400 text-sm font-satoshi-regular">
                Your 24×7 AI superconnector that never sleeps, always listens, and helps you build meaningful connections.
              </p>
            </div>
        
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p className="font-satoshi-regular">&copy; 2024 AI Twitter Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
