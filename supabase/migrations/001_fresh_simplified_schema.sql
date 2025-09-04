-- Migration 001: Fresh Simplified Schema
-- Complete database schema for simplified Twitter monitoring system
-- This replaces all existing tables with a clean, focused structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- USER PROFILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INTENT FILTERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.intent_filters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique keywords per user
    UNIQUE(user_id, keyword)
);

-- ========================================
-- TWITTER OAUTH CONNECTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.twitter_oauth_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    twitter_user_id TEXT NOT NULL,
    twitter_username TEXT NOT NULL,
    oauth_token TEXT NOT NULL,
    oauth_token_secret TEXT NOT NULL,
    connection_status TEXT DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'expired')),
    permissions JSONB DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one connection per user
    UNIQUE(user_id)
);

-- ========================================
-- AI RESPONSES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.ai_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    tweet_id TEXT,
    content TEXT NOT NULL,
    intent TEXT NOT NULL,
    response_type TEXT DEFAULT 'reply' CHECK (response_type IN ('reply', 'quote', 'retweet', 'like')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
    ai_generated BOOLEAN DEFAULT TRUE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CONTENT SCHEDULE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.content_schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    content_type TEXT DEFAULT 'tweet' CHECK (content_type IN ('tweet', 'thread', 'poll')),
    title TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    twitter_post_id TEXT,
    engagement_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SYSTEM LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON public.user_profiles(is_admin);

CREATE INDEX IF NOT EXISTS idx_intent_filters_user_id ON public.intent_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_filters_keyword ON public.intent_filters(keyword);

CREATE INDEX IF NOT EXISTS idx_twitter_oauth_user_id ON public.twitter_oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_twitter_oauth_status ON public.twitter_oauth_connections(connection_status);

CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id ON public.ai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_status ON public.ai_responses(status);
CREATE INDEX IF NOT EXISTS idx_ai_responses_tweet_id ON public.ai_responses(tweet_id);

CREATE INDEX IF NOT EXISTS idx_content_schedule_user_id ON public.content_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON public.content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_at ON public.content_schedule(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_twitter_oauth_updated_at BEFORE UPDATE ON public.twitter_oauth_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_responses_updated_at BEFORE UPDATE ON public.ai_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_schedule_updated_at BEFORE UPDATE ON public.content_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- User profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Intent filters: Users can manage their own filters
CREATE POLICY "Users can manage own intent filters" ON public.intent_filters
    FOR ALL USING (auth.uid() = user_id);

-- Twitter OAuth: Users can manage their own connections
CREATE POLICY "Users can manage own Twitter connections" ON public.twitter_oauth_connections
    FOR ALL USING (auth.uid() = user_id);

-- AI Responses: Users can manage their own responses
CREATE POLICY "Users can manage own AI responses" ON public.ai_responses
    FOR ALL USING (auth.uid() = user_id);

-- Content Schedule: Users can manage their own content
CREATE POLICY "Users can manage own content schedule" ON public.content_schedule
    FOR ALL USING (auth.uid() = user_id);

-- System logs: Users can view logs related to their actions
CREATE POLICY "Users can view own system logs" ON public.system_logs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ========================================
-- INITIAL DATA (OPTIONAL)
-- ========================================

-- Create a default admin user profile (if needed)
-- This will be populated when users first authenticate

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================
COMMENT ON TABLE public.user_profiles IS 'User profile information and admin status';
COMMENT ON TABLE public.intent_filters IS 'User-defined keywords and phrases for Twitter monitoring';
COMMENT ON TABLE public.twitter_oauth_connections IS 'Twitter OAuth connection details for each user';
COMMENT ON TABLE public.ai_responses IS 'AI-generated responses to tweets';
COMMENT ON TABLE public.content_schedule IS 'Scheduled content posts for Twitter';
COMMENT ON TABLE public.system_logs IS 'System activity and error logs';

COMMENT ON COLUMN public.intent_filters.keyword IS 'Keyword or phrase to monitor on Twitter';
COMMENT ON COLUMN public.twitter_oauth_connections.connection_status IS 'Current status of Twitter connection';
COMMENT ON COLUMN public.ai_responses.confidence_score IS 'AI confidence score (0.00 to 1.00)';
COMMENT ON COLUMN public.content_schedule.engagement_metrics IS 'JSON object containing engagement data';
COMMENT ON COLUMN public.system_logs.metadata IS 'Additional structured data for the log entry';
