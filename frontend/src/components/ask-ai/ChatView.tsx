import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface AIInsight {
  type: 'summary' | 'trend' | 'suggestion' | 'alert';
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
}

interface ChatViewProps {
  insights: AIInsight[];
  question: string;
  loading: boolean;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  onNewChat: () => void;
}

export function ChatView({
  insights,
  question,
  loading,
  onQuestionChange,
  onSubmit,
  onNewChat,
}: ChatViewProps) {
  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto min-h-[calc(100vh-12rem)]"
    >
      {/* Header with New Chat button */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onNewChat}
          className="hover:bg-red-500/10 text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="space-y-8 mb-32">
        {/* User Question */}
        {insights.length > 0 && insights[0].title && (
          <ChatMessage type="user" content={insights[0].title} />
        )}

        {/* AI Responses */}
        {insights.map((insight, index) => (
          <ChatMessage
            key={index}
            type="ai"
            content={insight.content}
            delay={0.2}
          />
        ))}
      </div>

      {/* Input Area */}
      <ChatInput
        value={question}
        loading={loading}
        placeholder="Ask a follow-up question..."
        onChange={onQuestionChange}
        onSubmit={onSubmit}
      />
    </motion.div>
  );
}
