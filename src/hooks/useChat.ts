import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  workflow_context?: any;
}

interface WorkflowContext {
  nodes?: any[];
  edges?: any[];
  workflows?: any[];
}

export const useChat = (deviceId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!deviceId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data) {
        setMessages(data.map(msg => ({
          ...msg,
          role: msg.role as 'user' | 'assistant' | 'system'
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [deviceId]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string, workflowContext?: WorkflowContext) => {
    if (!deviceId || !content.trim()) return;

    setIsLoading(true);

    // Add user message immediately to UI
    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
      workflow_context: workflowContext
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content.trim(),
          deviceId,
          workflowContext
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to get AI response');
      }

      // Add AI response to UI
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
        workflow_context: workflowContext
      };

      setMessages(prev => [...prev.slice(0, -1), userMessage, aiMessage]);

      // Reload chat history to get proper IDs from database
      setTimeout(() => loadChatHistory(), 500);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the temporary user message on error
      setMessages(prev => prev.slice(0, -1));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, toast, loadChatHistory]);

  // Clear chat history
  const clearChat = useCallback(async () => {
    if (!deviceId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('device_id', deviceId);

      if (error) {
        throw new Error(error.message);
      }

      setMessages([]);
      toast({
        title: "Chat cleared",
        description: "Chat history has been cleared",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    }
  }, [deviceId, toast]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadChatHistory,
    clearChat
  };
};