import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiChatSidebar } from './AiChatSidebar';

interface AiChatToggleProps {
  workflowContext?: {
    nodes?: any[];
    edges?: any[];
    workflows?: any[];
  };
}

export const AiChatToggle = ({ workflowContext }: AiChatToggleProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full w-14 h-14 p-0 group"
          size="sm"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 text-xs">🔥</div>
          </div>
        </Button>
      )}

      {/* Chat Sidebar */}
      <AiChatSidebar
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        workflowContext={workflowContext}
      />
    </>
  );
};