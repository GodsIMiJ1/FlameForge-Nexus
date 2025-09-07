-- Fix search path security warnings for API functions
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.hash_api_key(key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_api_key(key TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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