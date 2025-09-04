-- Migration 007: AI Superconnector Content System
-- Adds tables for AI-generated content, performance tracking, and content themes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- AI SUPERCONNECTOR CONTENT TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.ai_superconnector_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('networking_tip', 'ai_insight', 'startup_humor', 'community_content', 'connection_story', 'tech_trend')),
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    emojis TEXT[] DEFAULT '{}',
    engagement_prompt TEXT,
    follow_up_content TEXT,
    ai_generated BOOLEAN DEFAULT TRUE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    performance_metrics JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'archived')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    twitter_post_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CONTENT PERFORMANCE TRACKING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.content_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.ai_superconnector_content(id) ON DELETE CASCADE NOT NULL,
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0.0,
    performance_score DECIMAL(3,2) DEFAULT 0.0,
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CONTENT THEMES AND CATEGORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.content_themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    hashtags TEXT[] DEFAULT '{}',
    optimal_posting_times TEXT[] DEFAULT '{}',
    engagement_patterns JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CONTENT SCHEDULING TABLE
-- ========================================
-- Note: content_schedule table already exists from previous migration
-- This migration will only add new columns if they don't exist
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_schedule' AND column_name = 'posting_time_slot') THEN
        ALTER TABLE public.content_schedule ADD COLUMN posting_time_slot TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_schedule' AND column_name = 'timezone') THEN
        ALTER TABLE public.content_schedule ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_schedule' AND column_name = 'retry_count') THEN
        ALTER TABLE public.content_schedule ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_schedule' AND column_name = 'max_retries') THEN
        ALTER TABLE public.content_schedule ADD COLUMN max_retries INTEGER DEFAULT 3;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_schedule' AND column_name = 'error_message') THEN
        ALTER TABLE public.content_schedule ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- ========================================
-- CONTENT APPROVAL WORKFLOW TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.content_approval (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.ai_superconnector_content(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes')),
    feedback TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CONTENT VARIETY METRICS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.content_variety_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    content_type_distribution JSONB DEFAULT '{}',
    hashtag_usage JSONB DEFAULT '{}',
    emoji_usage JSONB DEFAULT '{}',
    engagement_patterns JSONB DEFAULT '{}',
    last_content_types TEXT[] DEFAULT '{}',
    variety_score DECIMAL(3,2) DEFAULT 0.0,
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- AI Superconnector Content indexes
CREATE INDEX IF NOT EXISTS idx_ai_superconnector_content_user_id ON public.ai_superconnector_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_superconnector_content_type ON public.ai_superconnector_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_superconnector_content_status ON public.ai_superconnector_content(status);
CREATE INDEX IF NOT EXISTS idx_ai_superconnector_content_scheduled_at ON public.ai_superconnector_content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ai_superconnector_content_created_at ON public.ai_superconnector_content(created_at);

-- Content Performance indexes
CREATE INDEX IF NOT EXISTS idx_content_performance_content_id ON public.content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_tracked_at ON public.content_performance(tracked_at);

-- Content Schedule indexes (check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_schedule') THEN
        -- Create indexes if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_schedule_user_id') THEN
            CREATE INDEX idx_content_schedule_user_id ON public.content_schedule(user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_schedule_scheduled_at') THEN
            CREATE INDEX idx_content_schedule_scheduled_at ON public.content_schedule(scheduled_at);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_schedule_status') THEN
            CREATE INDEX idx_content_schedule_status ON public.content_schedule(status);
        END IF;
    END IF;
END $$;

-- Content Approval indexes
CREATE INDEX IF NOT EXISTS idx_content_approval_content_id ON public.content_approval(content_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_status ON public.content_approval(status);

-- Content Variety Metrics indexes
CREATE INDEX IF NOT EXISTS idx_content_variety_metrics_user_id ON public.content_variety_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_content_variety_metrics_tracked_at ON public.content_variety_metrics(tracked_at);

-- ========================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ========================================

-- AI Superconnector Content trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_superconnector_content_updated_at') THEN
        CREATE TRIGGER update_ai_superconnector_content_updated_at
            BEFORE UPDATE ON public.ai_superconnector_content
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Content Performance trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_performance_updated_at') THEN
        CREATE TRIGGER update_content_performance_updated_at
            BEFORE UPDATE ON public.content_performance
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Content Schedule trigger (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_schedule_updated_at') THEN
        CREATE TRIGGER update_content_schedule_updated_at
            BEFORE UPDATE ON public.content_schedule
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Content Approval trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_approval_updated_at') THEN
        CREATE TRIGGER update_content_approval_updated_at
            BEFORE UPDATE ON public.content_approval
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Content Variety Metrics trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_variety_metrics_updated_at') THEN
        CREATE TRIGGER update_content_variety_metrics_updated_at
            BEFORE UPDATE ON public.content_variety_metrics
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ========================================
-- INITIAL DATA SEEDING
-- ========================================

-- Insert default content themes
INSERT INTO public.content_themes (name, description, hashtags, optimal_posting_times, engagement_patterns) VALUES
('networking_tips', 'Professional networking strategies and insights', ARRAY['#Networking', '#ProfessionalGrowth', '#RelationshipBuilding'], ARRAY['9:00 AM', '12:00 PM', '6:00 PM'], '{"question_patterns": 0.4, "story_patterns": 0.3, "advice_patterns": 0.3}'),
('ai_insights', 'AI industry trends and future implications', ARRAY['#AI', '#TechTrends', '#FutureOfWork'], ARRAY['10:00 AM', '2:00 PM', '5:00 PM'], '{"insight_patterns": 0.5, "prediction_patterns": 0.3, "question_patterns": 0.2}'),
('startup_humor', 'Founder-friendly humor and tech memes', ARRAY['#StartupLife', '#FounderHumor', '#TechMemes'], ARRAY['11:00 AM', '3:00 PM', '7:00 PM'], '{"humor_patterns": 0.6, "story_patterns": 0.3, "question_patterns": 0.1}'),
('community_building', 'Community building strategies and success stories', ARRAY['#CommunityBuilding', '#Collaboration', '#Networking'], ARRAY['9:00 AM', '1:00 PM', '4:00 PM'], '{"strategy_patterns": 0.4, "story_patterns": 0.4, "question_patterns": 0.2}'),
('connection_stories', 'Success stories and case studies', ARRAY['#SuccessStories', '#Networking', '#Collaboration'], ARRAY['10:00 AM', '2:00 PM', '6:00 PM'], '{"story_patterns": 0.7, "question_patterns": 0.2, "advice_patterns": 0.1}'),
('tech_trends', 'Emerging technology trends and insights', ARRAY['#TechTrends', '#Innovation', '#FutureTech'], ARRAY['11:00 AM', '3:00 PM', '5:00 PM'], '{"insight_patterns": 0.5, "prediction_patterns": 0.3, "question_patterns": 0.2}')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.ai_superconnector_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_variety_metrics ENABLE ROW LEVEL SECURITY;

-- AI Superconnector Content policies
CREATE POLICY "Users can view their own content" ON public.ai_superconnector_content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON public.ai_superconnector_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON public.ai_superconnector_content
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON public.ai_superconnector_content
    FOR DELETE USING (auth.uid() = user_id);

-- Content Performance policies
CREATE POLICY "Users can view performance of their content" ON public.content_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_superconnector_content 
            WHERE id = content_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert performance for their content" ON public.content_performance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_superconnector_content 
            WHERE id = content_id AND user_id = auth.uid()
        )
    );

-- Content Themes policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view content themes" ON public.content_themes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Content Schedule policies (check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_schedule') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own schedules" ON public.content_schedule;
        DROP POLICY IF EXISTS "Users can manage their own schedules" ON public.content_schedule;
        
        -- Create new policies
        CREATE POLICY "Users can view their own schedules" ON public.content_schedule
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can manage their own schedules" ON public.content_schedule
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Content Approval policies
CREATE POLICY "Users can view approvals for their content" ON public.content_approval
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_superconnector_content 
            WHERE id = content_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage approvals for their content" ON public.content_approval
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ai_superconnector_content 
            WHERE id = content_id AND user_id = auth.uid()
        )
    );

-- Content Variety Metrics policies
CREATE POLICY "Users can view their own variety metrics" ON public.content_variety_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own variety metrics" ON public.content_variety_metrics
    FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.ai_superconnector_content IS 'Stores AI-generated content for the AI Superconnector brand';
COMMENT ON TABLE public.content_performance IS 'Tracks performance metrics for published content';
COMMENT ON TABLE public.content_themes IS 'Defines content themes and their optimal posting patterns';
COMMENT ON TABLE public.content_schedule IS 'Manages content scheduling and posting workflow';
COMMENT ON TABLE public.content_approval IS 'Manages content approval workflow for human oversight';
COMMENT ON TABLE public.content_variety_metrics IS 'Tracks content variety metrics to ensure diverse content';

COMMENT ON COLUMN public.ai_superconnector_content.content_type IS 'Type of content: networking_tip, ai_insight, startup_humor, community_content, connection_story, tech_trend';
COMMENT ON COLUMN public.ai_superconnector_content.confidence_score IS 'AI confidence score for the generated content (0.0 to 1.0)';
COMMENT ON COLUMN public.ai_superconnector_content.performance_metrics IS 'JSON object containing various performance indicators';
COMMENT ON COLUMN public.content_performance.engagement_rate IS 'Calculated engagement rate (likes + retweets + replies) / impressions';
COMMENT ON COLUMN public.content_performance.performance_score IS 'Overall performance score based on multiple metrics (0.0 to 1.0)';
COMMENT ON COLUMN public.content_schedule.posting_time_slot IS 'Preferred posting time slot for optimal engagement';
COMMENT ON COLUMN public.content_variety_metrics.variety_score IS 'Overall variety score to ensure content diversity (0.0 to 1.0)';
