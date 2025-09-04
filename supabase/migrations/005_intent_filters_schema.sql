-- Migration 005: Add Intent Filters Schema
-- This migration adds support for user-specific intent filters and monitoring rules

-- Create intent_filters table
CREATE TABLE IF NOT EXISTS public.intent_filters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    keyword TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique keywords per user
    UNIQUE(user_id, keyword)
);

-- Create monitoring_rules table for more advanced filtering
CREATE TABLE IF NOT EXISTS public.monitoring_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    exclude_retweets BOOLEAN DEFAULT TRUE,
    exclude_replies BOOLEAN DEFAULT FALSE,
    languages TEXT[] DEFAULT ARRAY['en'],
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intent_filters_user_id ON public.intent_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_filters_active ON public.intent_filters(is_active);
CREATE INDEX IF NOT EXISTS idx_monitoring_rules_user_id ON public.monitoring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_rules_next_run ON public.monitoring_rules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_rules_active ON public.monitoring_rules(is_active);

-- Apply updated_at triggers
CREATE TRIGGER update_intent_filters_updated_at BEFORE UPDATE ON public.intent_filters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitoring_rules_updated_at BEFORE UPDATE ON public.monitoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.intent_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intent_filters
CREATE POLICY "Users can manage their own intent filters" ON public.intent_filters
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for monitoring_rules
CREATE POLICY "Users can manage their own monitoring rules" ON public.monitoring_rules
    FOR ALL USING (auth.uid() = user_id);

-- Insert default monitoring rule for existing users (if any)
-- This will be handled by the application when users first access the intent filters
