-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE tweet_status AS ENUM ('pending', 'processing', 'responded', 'failed');
CREATE TYPE response_type AS ENUM ('reply', 'quote', 'retweet', 'like');
CREATE TYPE content_status AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    twitter_handle TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitored tweets table
CREATE TABLE IF NOT EXISTS public.monitored_tweets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tweet_id TEXT UNIQUE NOT NULL,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    content TEXT NOT NULL,
    tweet_url TEXT,
    status tweet_status DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    keywords TEXT[],
    sentiment_score DECIMAL(3, 2),
    engagement_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    assigned_user_id UUID REFERENCES public.user_profiles(id)
);

-- Agent responses table
CREATE TABLE IF NOT EXISTS public.agent_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    monitored_tweet_id UUID REFERENCES public.monitored_tweets(id) ON DELETE CASCADE,
    response_type response_type NOT NULL,
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT TRUE,
    confidence_score DECIMAL(3, 2),
    status content_status DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    twitter_response_id TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content schedule table
CREATE TABLE IF NOT EXISTS public.content_schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    status content_status DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    twitter_post_id TEXT,
    engagement_metrics JSONB,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Twitter API rate limiting table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    requests_made INTEGER DEFAULT 0,
    requests_limit INTEGER NOT NULL,
    reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    user_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitored_tweets_status ON public.monitored_tweets(status);
CREATE INDEX IF NOT EXISTS idx_monitored_tweets_priority ON public.monitored_tweets(priority);
CREATE INDEX IF NOT EXISTS idx_monitored_tweets_created_at ON public.monitored_tweets(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_responses_tweet_id ON public.agent_responses(tweet_id);
CREATE INDEX IF NOT EXISTS idx_agent_responses_status ON public.agent_responses(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_at ON public.content_schedule(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON public.content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitored_tweets_updated_at BEFORE UPDATE ON public.monitored_tweets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_responses_updated_at BEFORE UPDATE ON public.agent_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_schedule_updated_at BEFORE UPDATE ON public.content_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_rate_limits_updated_at BEFORE UPDATE ON public.api_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Monitored tweets policies
CREATE POLICY "Users can view monitored tweets" ON public.monitored_tweets
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage monitored tweets" ON public.monitored_tweets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Agent responses policies
CREATE POLICY "Users can view agent responses" ON public.agent_responses
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage agent responses" ON public.agent_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Content schedule policies
CREATE POLICY "Users can view content schedule" ON public.content_schedule
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage content schedule" ON public.content_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- API rate limits policies (admin only)
CREATE POLICY "Admins can manage rate limits" ON public.api_rate_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- System logs policies (admin only)
CREATE POLICY "Admins can view system logs" ON public.system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Insert initial admin user (if needed)
-- This will be handled by the application when the first user signs up
