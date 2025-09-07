-- Create API keys table for external authentication
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for API keys
CREATE POLICY "Users can manage their own API keys"
ON public.api_keys
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can view all API keys"
ON public.api_keys
FOR SELECT
USING (is_workflow_admin());

-- Create API usage tracking table
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  request_size INTEGER,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on usage logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for usage logs
CREATE POLICY "Users can view logs for their API keys"
ON public.api_usage_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.api_keys 
  WHERE id = api_key_id AND created_by = auth.uid()
));

CREATE POLICY "Admins can view all usage logs"
ON public.api_usage_logs
FOR SELECT
USING (is_workflow_admin());

CREATE POLICY "System can insert usage logs"
ON public.api_usage_logs
FOR INSERT
WITH CHECK (true);

-- Create function to generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  api_key TEXT := 'ff_';
  i INTEGER;
BEGIN
  -- Generate random 32 character key with ff_ prefix
  FOR i IN 1..32 LOOP
    api_key := api_key || substr(key_chars, floor(random() * length(key_chars) + 1)::integer, 1);
  END LOOP;
  
  RETURN api_key;
END;
$$;

-- Create function to hash API key
CREATE OR REPLACE FUNCTION public.hash_api_key(key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$;

-- Create function to validate API key
CREATE OR REPLACE FUNCTION public.validate_api_key(key TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_id UUID;
  key_hash TEXT;
BEGIN
  key_hash := public.hash_api_key(key);
  
  SELECT id INTO key_id
  FROM public.api_keys
  WHERE key_hash = public.hash_api_key(key)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
    
  IF key_id IS NOT NULL THEN
    -- Update last used timestamp and usage count
    UPDATE public.api_keys 
    SET last_used_at = now(), usage_count = usage_count + 1
    WHERE id = key_id;
  END IF;
  
  RETURN key_id;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workbench_updated_at();