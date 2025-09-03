// Database types for simplified Twitter monitoring system

// ========================================
// USER PROFILES
// ========================================
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// INTENT FILTERS
// ========================================
export interface IntentFilter {
  id: string;
  user_id: string;
  keyword: string;
  created_at: string;
}

// ========================================
// TWITTER OAUTH CONNECTIONS
// ========================================
export interface TwitterOAuthConnection {
  id: string;
  user_id: string;
  twitter_user_id: string;
  twitter_username: string;
  oauth_token: string;
  oauth_token_secret: string;
  connection_status: TwitterConnectionStatus;
  permissions: Record<string, unknown>;
  last_used: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// AI RESPONSES
// ========================================
export interface AIResponse {
  id: string;
  user_id: string;
  tweet_id?: string;
  content: string;
  intent: string;
  response_type: ResponseType;
  status: ResponseStatus;
  ai_generated: boolean;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

// ========================================
// CONTENT SCHEDULE
// ========================================
export interface ContentSchedule {
  id: string;
  user_id: string;
  content_type: ContentType;
  title?: string;
  content: string;
  status: ContentStatus;
  scheduled_at?: string;
  published_at?: string;
  twitter_post_id?: string;
  engagement_metrics: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ========================================
// SYSTEM LOGS
// ========================================
export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  created_at: string;
}

// ========================================
// ENUMS
// ========================================
export type TwitterConnectionStatus = 'connected' | 'disconnected' | 'error' | 'expired';
export type ResponseType = 'reply' | 'quote' | 'retweet' | 'like';
export type ResponseStatus = 'pending' | 'approved' | 'rejected' | 'published';
export type ContentType = 'tweet' | 'thread' | 'poll';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';

// ========================================
// CONSTANTS
// ========================================
export const TWITTER_CONNECTION_STATUSES: TwitterConnectionStatus[] = ['connected', 'disconnected', 'error', 'expired'];
export const RESPONSE_TYPES: ResponseType[] = ['reply', 'quote', 'retweet', 'like'];
export const RESPONSE_STATUSES: ResponseStatus[] = ['pending', 'approved', 'rejected', 'published'];
export const CONTENT_TYPES: ContentType[] = ['tweet', 'thread', 'poll'];
export const CONTENT_STATUSES: ContentStatus[] = ['draft', 'scheduled', 'published', 'failed'];

// ========================================
// CREATE/UPDATE TYPES
// ========================================
export type CreateUserProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;

export type CreateIntentFilter = Omit<IntentFilter, 'id' | 'created_at'>;
export type UpdateIntentFilter = Partial<Omit<IntentFilter, 'id' | 'created_at'>>;

export type CreateTwitterOAuthConnection = Omit<TwitterOAuthConnection, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTwitterOAuthConnection = Partial<Omit<TwitterOAuthConnection, 'id' | 'created_at' | 'updated_at'>>;

export type CreateAIResponse = Omit<AIResponse, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAIResponse = Partial<Omit<AIResponse, 'id' | 'created_at' | 'updated_at'>>;

export type CreateContentSchedule = Omit<ContentSchedule, 'id' | 'created_at' | 'updated_at'>;
export type UpdateContentSchedule = Partial<Omit<ContentSchedule, 'id' | 'created_at' | 'updated_at'>>;

export type CreateSystemLog = Omit<SystemLog, 'id' | 'created_at'>;
export type UpdateSystemLog = Partial<Omit<SystemLog, 'id' | 'created_at'>>;
