-- Fix security warnings for function search paths
ALTER FUNCTION public.update_chat_messages_updated_at() SET search_path = public;