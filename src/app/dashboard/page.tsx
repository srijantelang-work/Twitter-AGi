"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { IntentFilters } from "@/components/twitter-agent/intent-filters"

import { LiveFeed } from "@/components/twitter-agent/live-feed"

import { ContentScheduler } from "@/components/twitter-agent/content-scheduler"
import ContentDashboard from "@/components/twitter-agent/content-dashboard"

import { Plus, LogOut, User } from "lucide-react"
import { DashboardDataProvider } from '@/contexts/DashboardDataContext'
import { ErrorBoundary } from '@/contexts/ErrorBoundary'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('listen')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <ErrorBoundary>
      <DashboardDataProvider>
        <div className="min-h-screen bg-gray-50">
          <main className="flex min-h-screen flex-col gap-6 p-4 md:p-6">
            <header className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div>
                <h1 className="text-pretty text-2xl font-semibold tracking-tight md:text-3xl text-gray-900">AI Twitter Agent Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor intents, generate AI replies, and create AI Superconnector content.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-cyan-600" />
                  <span>{user.email}</span>
                </div>
                <Button 
                  onClick={signOut}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create AI Content
                </Button>
              </div>
            </header>



            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200">
                  <TabsTrigger value="listen" className="data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm">Always Listening</TabsTrigger>
                  <TabsTrigger value="create" className="data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm">AI Superconnector</TabsTrigger>
                </TabsList>

                <TabsContent value="listen" className="mt-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <IntentFilters className="md:col-span-1" />
                    <LiveFeed className="md:col-span-2" />
                  </div>
                </TabsContent>



                <TabsContent value="create" className="mt-6">
                  <ContentDashboard />
                </TabsContent>
              </Tabs>
            </div>


          </main>
        </div>
      </DashboardDataProvider>
    </ErrorBoundary>
  )
}
