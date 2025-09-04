-- Migration: Add Twitter OAuth connections table
-- This table stores user Twitter OAuth tokens and connection status

-- Create the user_twitter_connections table
CREATE TABLE IF NOT EXISTS user_twitter_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  twitter_user_id TEXT NOT NULL,
  twitter_username TEXT NOT NULL,
  oauth_token TEXT NOT NULL,
  oauth_token_secret TEXT NOT NULL,
  connection_status TEXT DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'expired')),
  permissions JSONB DEFAULT '{}',
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_twitter_connections_user_id ON user_twitter_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_twitter_connections_twitter_user_id ON user_twitter_connections(twitter_user_id);
CREATE INDEX IF NOT EXISTS idx_user_twitter_connections_status ON user_twitter_connections(connection_status);

-- Enable Row Level Security
ALTER TABLE user_twitter_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security
-- Users can only see their own connections
CREATE POLICY "Users can view own Twitter connections" ON user_twitter_connections
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert own Twitter connections" ON user_twitter_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own Twitter connections" ON user_twitter_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own Twitter connections" ON user_twitter_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_twitter_connections_updated_at
  BEFORE UPDATE ON user_twitter_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_twitter_connections IS 'Stores user Twitter OAuth connections and tokens';
COMMENT ON COLUMN user_twitter_connections.oauth_token IS 'Twitter OAuth access token (should be encrypted in production)';
COMMENT ON COLUMN user_twitter_connections.oauth_token_secret IS 'Twitter OAuth access token secret (should be encrypted in production)';
COMMENT ON COLUMN user_twitter_connections.permissions IS 'JSON object storing granted OAuth scopes and permissions';
COMMENT ON COLUMN user_twitter_connections.connection_status IS 'Current status of the Twitter connection';
