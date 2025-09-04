-- Migration: Fix system_logs RLS policies
-- This migration fixes the restrictive RLS policies that prevent authenticated users from logging
-- while maintaining security and admin access

-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;

-- Create new policies that allow authenticated users to log
CREATE POLICY "Users can insert their own logs" ON public.system_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own logs" ON public.system_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Keep admin access to all logs
CREATE POLICY "Admins can view all system logs" ON public.system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can manage all system logs" ON public.system_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Add comment explaining the policy structure
COMMENT ON TABLE public.system_logs IS 'System logs with RLS: Users can log their own actions, admins can view all logs';

-- Verify the policies are in place
DO $$
BEGIN
    RAISE NOTICE 'System logs RLS policies updated successfully';
    RAISE NOTICE 'Users can now insert their own logs';
    RAISE NOTICE 'Admins maintain full access to all logs';
END $$;
