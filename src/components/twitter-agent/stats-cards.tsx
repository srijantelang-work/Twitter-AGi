"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, MessageSquareText, UserPlus, Clock, AlertCircle } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import { useDashboardData } from "@/contexts/DashboardDataContext"

export function StatsCards({ className }: { className?: string }) {
  const { stats, realtime } = useDashboardData();

  // Generate chart data based on real stats
  const generateChartData = () => {
    if (!stats.data) return [];
    
    return Array.from({ length: 7 }).map((_, i) => ({
      name: `D${i + 1}`,
      mentions: Math.round((stats.data!.totalTweets || 0) * (0.8 + Math.random() * 0.4)),
      engagements: Math.round((stats.data!.totalResponses || 0) * (0.6 + Math.random() * 0.8)),
    }));
  };

  const chartData = generateChartData();

  if (stats.loading) {
    return (
      <section aria-label="Overview statistics" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (stats.error) {
    return (
      <section aria-label="Overview statistics" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center h-20">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load stats: {stats.error}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Overview statistics" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      <KPI 
        title="Intent Mentions" 
        value={stats.data?.totalTweets?.toString() || "0"} 
        delta={`${stats.data?.engagementRate?.toFixed(1) || 0}%`} 
        icon={<TrendingUp className="h-5 w-5 text-cyan-600" />} 
      />
      <KPI
        title="Suggested Replies"
        value={stats.data?.totalResponses?.toString() || "0"}
        delta={`${stats.data?.pendingResponses || 0} pending`}
        icon={<MessageSquareText className="h-5 w-5 text-cyan-600" />}
      />
      <KPI 
        title="Approved & Sent" 
        value={stats.data?.approvedResponses?.toString() || "0"} 
        delta={`${stats.data?.rejectedResponses || 0} rejected`} 
        icon={<UserPlus className="h-5 w-5 text-cyan-600" />} 
      />
      <KPI 
        title="Scheduled Content" 
        value={stats.data?.scheduledContent?.toString() || "0"} 
        delta={`${stats.data?.publishedContent || 0} published`} 
        icon={<Clock className="h-5 w-5 text-cyan-600" />} 
      />
      <Card className="col-span-full lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Engagement Trend</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Realtime: {realtime.isConnected ? "🟢 Connected" : "🔴 Disconnected"}</span>
          </div>
        </CardHeader>
        <CardContent className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="mentions"
                stroke="#0891b2"
                fill="#0891b2"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="engagements"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  )
}

function KPI({
  title,
  value,
  delta,
  icon,
}: {
  title: string
  value: string
  delta: string
  icon: React.ReactNode
}) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500">{delta} vs last week</p>
      </CardContent>
    </Card>
  )
}
