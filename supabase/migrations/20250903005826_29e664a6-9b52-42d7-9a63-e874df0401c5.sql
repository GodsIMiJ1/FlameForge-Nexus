-- Fix linter issues introduced by the last migration
-- 1) Move pgvector extension to the 'extensions' schema (recommended by Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION IF EXISTS vector SET SCHEMA extensions;

-- 2) Ensure functions have a fixed search_path
CREATE OR REPLACE FUNCTION public.update_workbench_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;