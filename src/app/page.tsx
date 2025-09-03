"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Sparkles, 
  MessageSquare, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Bot
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-cyan-600" />
              <span className="text-xl font-bold text-gray-900">AI Twitter Agent</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Growing Fast
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your 24×7 AI
            <span className="text-cyan-600"> Twitter Superconnector</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Automatically detect help requests, suggest human-like replies, and schedule engaging content. 
            Never miss an opportunity to connect and help your community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-4">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Supercharge Your Twitter Engagement
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three powerful tools in one platform to make your Twitter presence unstoppable
            </p>
          </div>

          <Tabs defaultValue="listen" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-12">
              <TabsTrigger value="listen" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Always Listening
              </TabsTrigger>
              <TabsTrigger value="engage" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Smart Engagement
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Content Creation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listen" className="mt-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Never Miss an Opportunity
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Our AI continuously monitors Twitter for intent signals like &ldquo;looking for&rdquo;, &ldquo;anyone know&rdquo;, 
                    &ldquo;recommend&rdquo;, and &ldquo;intro to&rdquo;. When it detects someone who needs help or wants to connect, 
                    you&apos;ll know instantly.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Real-time intent detection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Customizable keyword filters</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Smart categorization and tagging</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-2xl">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-cyan-700">MP</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Maya Patel</p>
                          <p className="text-xs text-gray-500">@mayap • 4m</p>
                        </div>
                      </div>
                      <p className="text-sm">Anyone know a good AI scheduling tool that handles time zones well?</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">tools</Badge>
                        <Badge variant="outline" className="text-xs">help</Badge>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">LC</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Leo Chen</p>
                          <p className="text-xs text-gray-500">@leochen • 12m</p>
                        </div>
                      </div>
                      <p className="text-sm">Visiting SF this week—would love to meet fellow founders for coffee.</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">meetups</Badge>
                        <Badge variant="outline" className="text-xs">intros</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="engage" className="mt-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                        <div className="text-xs text-gray-500 mb-2">Suggested Reply for @mayap</div>
                        <p className="text-sm mb-3">&ldquo;I know a solid one&mdash;&apos;ChronoPilot&apos;. Happy to intro you to the founder if you want a fast tour. Want me to connect?&rdquo;</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">helpful</Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">intro-ready</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    AI-Generated, Human-Approved
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Our AI analyzes the context and generates natural, helpful replies that sound like they came 
                    from a real person. You review, approve, and send&mdash;maintaining your authentic voice while 
                    scaling your engagement.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Context-aware responses</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Human-like tone and personality</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>One-click approval and sending</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create" className="mt-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Schedule Engaging Content
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Plan and schedule witty posts, memes, and founder humor. Our AI helps you create content 
                    that resonates with your audience while maintaining a consistent posting schedule.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Smart content categorization</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Optimal timing suggestions</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Content performance analytics</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700">Superconnector</Badge>
                        <span className="text-xs text-gray-500">Tomorrow, 10:00 AM</span>
                      </div>
                      <p className="text-sm">An AI superconnector reduces &apos;who should I ask?&apos; to &apos;done.&apos; Intros at the speed of thought.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-pink-50 text-pink-700">Humor</Badge>
                        <span className="text-xs text-gray-500">Fri, 1:30 PM</span>
                      </div>
                      <p className="text-sm">Founders: &apos;We need distribution.&apos; AI: &apos;What if I just befriended the internet?&apos;</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Growing Communities
            </h2>
            <p className="text-xl text-gray-600">
              See the impact our AI agents are making across Twitter
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-600 mb-2">842</div>
              <div className="text-gray-600">Intent Mentions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-600 mb-2">319</div>
              <div className="text-gray-600">Suggested Replies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-600 mb-2">204</div>
              <div className="text-gray-600">Approved & Sent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Twitter Game?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of founders, creators, and community builders who are already using AI to scale their impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-4">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-cyan-400" />
                <span className="text-lg font-bold">AI Twitter Agent</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your 24×7 AI superconnector that never sleeps, always listens, and helps you build meaningful connections.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 AI Twitter Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
