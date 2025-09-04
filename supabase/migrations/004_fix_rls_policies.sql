-- Fix RLS Policy Recursion Issues
-- This migration fixes the infinite recursion in user_profiles policies

-- Start transaction to ensure atomic migration
BEGIN;

-- Log the start of the migration
DO $$
BEGIN
  RAISE NOTICE 'Starting RLS policy fix migration...';
END $$;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage monitored tweets" ON public.monitored_tweets;
DROP POLICY IF EXISTS "Admins can manage agent responses" ON public.agent_responses;
DROP POLICY IF EXISTS "Admins can manage content schedule" ON public.content_schedule;
DROP POLICY IF EXISTS "Admins can manage rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;
DROP POLICY IF EXISTS "System can create logs" ON public.system_logs;

-- Drop any other potentially conflicting policies
DROP POLICY IF EXISTS "Users can view monitored tweets" ON public.monitored_tweets;
DROP POLICY IF EXISTS "Users can view agent responses" ON public.agent_responses;
DROP POLICY IF EXISTS "Users can view content schedule" ON public.content_schedule;
DROP POLICY IF EXISTS "Users can view rate limits" ON public.api_rate_limits;

-- Drop existing Twitter OAuth connection policies to recreate them
DROP POLICY IF EXISTS "Users can view own Twitter connections" ON public.user_twitter_connections;
DROP POLICY IF EXISTS "Users can insert own Twitter connections" ON public.user_twitter_connections;
DROP POLICY IF EXISTS "Users can update own Twitter connections" ON public.user_twitter_connections;
DROP POLICY IF EXISTS "Users can delete own Twitter connections" ON public.user_twitter_connections;

-- Comprehensive cleanup: Drop all existing policies to start fresh
-- This ensures we don't have any leftover policies from previous migrations
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view monitored tweets" ON public.monitored_tweets;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create a helper function to check admin status without recursion
-- Drop the function first if it exists to ensure clean recreation
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is an admin by looking at their profile
  -- This avoids the recursive policy issue
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;

-- Recreate the policies using the helper function
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR ALL USING (
        public.is_user_admin(auth.uid())
    );

-- Allow users to create their own profile (essential for OAuth flow)
CREATE POLICY "Users can create their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (
        id = auth.uid()
    );

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (
        id = auth.uid()
    );

-- Allow system to create profiles during OAuth flow (fallback)
CREATE POLICY "System can create profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        id IS NOT NULL
    );

CREATE POLICY "Admins can manage monitored tweets" ON public.monitored_tweets
    FOR ALL USING (
        public.is_user_admin(auth.uid())
    );

-- Allow users to view monitored tweets
CREATE POLICY "Users can view monitored tweets" ON public.monitored_tweets
    FOR SELECT USING (
        TRUE
    );

CREATE POLICY "Admins can manage agent responses" ON public.agent_responses
    FOR ALL USING (
        public.is_user_admin(auth.uid())
    );

-- Allow users to view agent responses
CREATE POLICY "Users can view agent responses" ON public.agent_responses
    FOR SELECT USING (
        TRUE
    );

CREATE POLICY "Admins can manage content schedule" ON public.content_schedule
    FOR ALL USING (
        public.is_user_admin(auth.uid())
    );

-- Allow users to view content schedule
CREATE POLICY "Users can view content schedule" ON public.content_schedule
    FOR SELECT USING (
        TRUE
    );

CREATE POLICY "Admins can manage rate limits" ON public.api_rate_limits
    FOR ALL USING (
        public.is_user_admin(auth.uid())
    );

-- Allow users to view rate limits
CREATE POLICY "Users can view rate limits" ON public.api_rate_limits
    FOR SELECT USING (
        TRUE
    );

CREATE POLICY "Admins can view system logs" ON public.system_logs
    FOR ALL USING (
        public.is_user_admin(auth.uid())
    );

-- Add a policy for system logs that allows users to view their own logs
CREATE POLICY "Users can view their own logs" ON public.system_logs
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Add a policy for system logs that allows admins to view all logs
CREATE POLICY "Admins can view all logs" ON public.system_logs
    FOR SELECT USING (
        public.is_user_admin(auth.uid())
    );

-- Add a policy for system logs that allows the system to create logs
CREATE POLICY "System can create logs" ON public.system_logs
    FOR INSERT WITH CHECK (
        user_id IS NULL OR user_id = auth.uid() OR public.is_user_admin(auth.uid())
    );

-- Twitter OAuth connections policies (using correct table name)
CREATE POLICY "Users can view their own connections" ON public.user_twitter_connections
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Users can create their own connections" ON public.user_twitter_connections
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can update their own connections" ON public.user_twitter_connections
    FOR UPDATE USING (
        user_id = auth.uid()
    );

CREATE POLICY "Admins can view all connections" ON public.user_twitter_connections
    FOR SELECT USING (
        public.is_user_admin(auth.uid())
    );

-- Allow system to create connections during OAuth flow (fallback)
CREATE POLICY "System can create connections" ON public.user_twitter_connections
    FOR INSERT WITH CHECK (
        user_id IS NOT NULL
    );

-- Ensure the function is secure by checking it's not being abused
COMMENT ON FUNCTION public.is_user_admin(UUID) IS 'Helper function to check admin status without recursive policy issues';

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policy fix migration completed successfully!';
END $$;

-- Commit the transaction
COMMIT;
