import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useChat } from '@/hooks/useChat';

interface AiChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  workflowContext?: {
    nodes?: any[];
    edges?: any[];
    workflows?: any[];
  };
}

export const AiChatSidebar = ({ isOpen, onToggle, workflowContext }: AiChatSidebarProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const deviceId = useDeviceId();
  const { messages, isLoading, sendMessage, loadChatHistory, clearChat } = useChat(deviceId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history when device ID is available
  useEffect(() => {
    if (deviceId) {
      loadChatHistory();
    }
  }, [deviceId, loadChatHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    await sendMessage(inputMessage, workflowContext);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        size="sm"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        AI Assistant
      </Button>
    );
  }

  return (
    <Card className="fixed right-0 top-0 h-screen w-96 z-40 border-l border-border shadow-xl bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">FORGE AI</h3>
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">🔥</div>
            </div>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Context indicators */}
          <div className="flex flex-wrap gap-1">
            {workflowContext?.nodes && workflowContext.nodes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {workflowContext.nodes.length} nodes
              </Badge>
            )}
            {workflowContext?.edges && workflowContext.edges.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {workflowContext.edges.length} edges
              </Badge>
            )}
            {workflowContext?.workflows && workflowContext.workflows.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {workflowContext.workflows.length} workflows
              </Badge>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Hey! I'm FORGE, your AI workflow architect 🔥</p>
                <p className="text-xs mt-1">Ask me about workflows, SaaS integrations, GitHub, deployments, or anything dev-related!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted border border-border'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 mb-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask FORGE about integrations, workflows, GitHub..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={clearChat} disabled={messages.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <div className="text-xs text-muted-foreground">
              Device: {deviceId.slice(-8)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};