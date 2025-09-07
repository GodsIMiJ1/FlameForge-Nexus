-- Create chat messages table for AI assistant
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  workflow_context jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Users can manage their own chat messages by device_id"
ON public.chat_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_chat_messages_device_id ON public.chat_messages(device_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_chat_messages_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_messages_updated_at();