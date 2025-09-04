-- Migration 006: Simplify Monitoring Schema
-- Remove complex monitoring rules and keep only simple intent filters

-- Drop the complex monitoring_rules table
DROP TABLE IF EXISTS public.monitoring_rules;

-- Simplify intent_filters table (remove is_active since we'll keep it simple)
ALTER TABLE public.intent_filters DROP COLUMN IF EXISTS is_active;

-- Update the table to be simpler
CREATE TABLE IF NOT EXISTS public.intent_filters_simple (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique keywords per user
    UNIQUE(user_id, keyword)
);

-- Copy data from old table to new simplified table
INSERT INTO public.intent_filters_simple (id, user_id, keyword, created_at)
SELECT id, user_id, keyword, created_at FROM public.intent_filters;

-- Drop old table and rename new one
DROP TABLE public.intent_filters;
ALTER TABLE public.intent_filters_simple RENAME TO intent_filters;

-- Recreate indexes for performance
CREATE INDEX IF NOT EXISTS idx_intent_filters_user_id ON public.intent_filters(user_id);

-- Enable RLS
ALTER TABLE public.intent_filters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intent_filters
CREATE POLICY "Users can manage their own intent filters" ON public.intent_filters
    FOR ALL USING (auth.uid() = user_id);
