"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { IntentFilters } from "@/components/twitter-agent/intent-filters"

import { LiveFeed } from "@/components/twitter-agent/live-feed"

import SimpleContentGenerator from "@/components/twitter-agent/simple-content-generator"

import { Plus, LogOut, User, RefreshCw, Loader2 } from "lucide-react"
import { DashboardDataProvider } from '@/contexts/DashboardDataContext'
import { ErrorBoundary } from '@/contexts/ErrorBoundary'
import { Tone } from '@/lib/ai/reply-generator'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('listen')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTone, setSelectedTone] = useState<Tone>('HELPFUL')

  const handleGlobalRefresh = async () => {
    setRefreshing(true)
    try {
      // Refresh all data by refreshing the page
      // This is a simple approach - in a more sophisticated implementation,
      // you could call refresh functions from the context
      window.location.reload()
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleToneChange = (tone: Tone) => {
    setSelectedTone(tone)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-satoshi">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!user) {
            router.push('/')
    return null
  }

  return (
    <ErrorBoundary>
      <DashboardDataProvider>
        <div className="min-h-screen bg-gray-50 font-satoshi">
          <main className="flex min-h-screen flex-col gap-6 p-4 md:p-6">
            <header className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div>
                <h1 className="text-pretty text-2xl font-satoshi-semibold tracking-tight md:text-3xl text-gray-900">AI Twitter Agent Dashboard</h1>
                <p className="text-gray-600 mt-2 font-satoshi-regular">Monitor intents, generate AI replies, and create AI Superconnector content.</p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleGlobalRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-satoshi-medium"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh All
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-satoshi-medium">
                  <User className="h-4 w-4 text-cyan-600" />
                  <span>{user.email}</span>
                </div>
                <Button 
                  onClick={signOut}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-satoshi-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm font-satoshi-semibold"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create AI Content
                </Button>
              </div>
            </header>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200">
                  <TabsTrigger value="listen" className="data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm font-satoshi-medium">Always Listening</TabsTrigger>
                  <TabsTrigger value="create" className="data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm font-satoshi-medium">AI Content Generator</TabsTrigger>
                </TabsList>

                <TabsContent value="listen" className="mt-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <IntentFilters 
                      className="md:col-span-1" 
                      selectedTone={selectedTone}
                      onToneChange={handleToneChange}
                    />
                    <LiveFeed 
                      className="md:col-span-2" 
                      selectedTone={selectedTone}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="create" className="mt-6">
                  <SimpleContentGenerator />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </DashboardDataProvider>
    </ErrorBoundary>
  )
}
