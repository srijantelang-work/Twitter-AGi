"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Twitter, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

interface AuthStatus {
  authenticated: boolean
  user?: {
    id: string
    email: string
    emailVerified: boolean
    provider: string
    twitterUsername?: string
    twitterUserId?: string
    createdAt: string
    lastSignIn: string
  }
  session?: {
    accessToken: string | null
    refreshToken: string | null
    expiresAt: number
  }
  error?: string
  message?: string
}

interface OAuthConfig {
  timestamp: string
  environment: string
  configuration: {
    supabase: {
      configured: boolean
      url: string
      anonKey: string
    }
    twitter: {
      oauth: {
        configured: boolean
        clientId: string
        clientSecret: string
      }
      api: {
        apiKey: string
        apiSecret: string
        bearerToken: string
      }
      callbackUrl: string
    }
  }
  recommendations: {
    supabase: string
    twitterOAuth: string
    twitterAPI: string
  }
}

export default function TestOAuthPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setAuthStatus(data)
    } catch (err) {
      setError('Failed to check auth status')
      console.error('Auth status check error:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkOAuthConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/debug/oauth-config')
      const data = await response.json()
      setOauthConfig(data)
    } catch (err) {
      setError('Failed to check OAuth config')
      console.error('OAuth config check error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testTwitterOAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Redirect to login page to test OAuth
      window.location.href = '/'
    } catch (err) {
      setError('Failed to test Twitter OAuth')
      console.error('Twitter OAuth test error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
    checkOAuthConfig()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">OAuth Configuration Test</h1>
          <p className="text-gray-600">Debug and test your OAuth configuration</p>
        </div>

        {/* OAuth Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              OAuth Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {oauthConfig ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Supabase</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={oauthConfig.configuration.supabase.configured ? "default" : "destructive"}>
                          {oauthConfig.configuration.supabase.configured ? "Configured" : "Missing"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {oauthConfig.configuration.supabase.url}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Twitter OAuth</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={oauthConfig.configuration.twitter.oauth.configured ? "default" : "destructive"}>
                          {oauthConfig.configuration.twitter.oauth.configured ? "Configured" : "Missing"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {oauthConfig.configuration.twitter.oauth.configured ? "Client ID & Secret" : "Missing"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Twitter API</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={oauthConfig.configuration.twitter.api.bearerToken ? "default" : "destructive"}>
                        {oauthConfig.configuration.twitter.api.bearerToken ? "Configured" : "Missing"}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {oauthConfig.configuration.twitter.api.bearerToken ? "Bearer Token" : "Missing"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Callback URL</h4>
                  <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                    {oauthConfig.configuration.twitter.callbackUrl}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading configuration...</p>
            )}
            
            <div className="mt-4">
              <Button onClick={checkOAuthConfig} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {authStatus?.authenticated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={authStatus.authenticated ? "default" : "destructive"}>
                    {authStatus.authenticated ? "Authenticated" : "Not Authenticated"}
                  </Badge>
                </div>
                
                {authStatus.authenticated && authStatus.user && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">User Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">ID:</span> {authStatus.user.id}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {authStatus.user.email}
                      </div>
                      <div>
                        <span className="font-medium">Provider:</span> {authStatus.user.provider}
                      </div>
                      <div>
                        <span className="font-medium">Twitter Username:</span> {authStatus.user.twitterUsername || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
                
                {!authStatus.authenticated && authStatus.error && (
                  <div className="text-red-600 text-sm">
                    <strong>Error:</strong> {authStatus.error}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading auth status...</p>
            )}
            
            <div className="mt-4">
              <Button onClick={checkAuthStatus} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button 
                onClick={testTwitterOAuth} 
                disabled={loading}
                className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
              >
                <Twitter className="h-5 w-5 mr-2" />
                Test Twitter OAuth Flow
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will redirect you to the login page to test the OAuth flow
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
