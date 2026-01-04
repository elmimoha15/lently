import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { askAI } from '@/lib/api/ai';
import type { Comment } from '@/lib/api/comments';

interface AskAISectionProps {
  videoId: string;
  comments: Comment[];
}

interface Message {
  type: 'user' | 'ai';
  content: string;
}

export function AskAISection({ videoId, comments }: AskAISectionProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What are the main themes in these comments?",
    "What questions are viewers asking most?",
    "What feedback do viewers have about the video?",
    "Are there any technical issues mentioned?",
    "What do viewers like most about this video?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAskAI = async () => {
    if (!question.trim() || !videoId) return;

    const userQuestion = question.trim();
    setQuestion('');
    
    // Add user message immediately
    setMessages(prev => [...prev, { type: 'user', content: userQuestion }]);
    setLoading(true);

    try {
      const response = await askAI({
        videoId,
        question: userQuestion,
        conversationId
      });
      
      // Add AI response
      setMessages(prev => [...prev, { type: 'ai', content: response.answer }]);
      setConversationId(response.conversationId);
      
      if (response.cached) {
        toast.success('Answer retrieved instantly from cache!');
      }
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      toast.error(err.response?.data?.detail || 'Failed to get AI response');
      // Remove the user message if request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  const renderMessageContent = (content: string) => {
    const sections = content.split('\n\n').filter(s => s.trim());
    
    return (
      <div className="space-y-3">
        {sections.map((section, idx) => {
          const lines = section.split('\n').filter(line => line.trim());
          
          return (
            <div key={idx} className="space-y-1.5">
              {lines.map((line, lineIdx) => {
                // Section headers with emojis
                if (line.match(/^[🔍💬👍😐👎❓🔁⚠️💡📊🔥]/)) {
                  return (
                    <h3 key={lineIdx} className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">
                      {line}
                    </h3>
                  );
                }
                // Bullet points
                if (line.startsWith('• ')) {
                  return (
                    <div key={lineIdx} className="flex gap-2 ml-1">
                      <span className="text-red-500 shrink-0 text-xs mt-0.5">•</span>
                      <span className="text-muted-foreground text-xs leading-relaxed">{line.substring(2)}</span>
                    </div>
                  );
                }
                // Quoted text
                if (line.includes('"')) {
                  return (
                    <p key={lineIdx} className="text-muted-foreground italic text-xs ml-1 border-l-2 border-red-500/30 pl-2 py-0.5">
                      {line}
                    </p>
                  );
                }
                // Regular text
                return (
                  <p key={lineIdx} className="text-muted-foreground text-xs leading-relaxed">
                    {line}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-none bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent flex flex-col h-[700px] shadow-lg shadow-red-500/5">
      <CardHeader className="border-b border-red-500/10 bg-gradient-to-r from-red-500/5 to-transparent pb-4 shrink-0">
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Sparkle className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse border-2 border-background" />
          </div>
          <div>
            <div className="text-lg font-semibold">Ask AI</div>
            <p className="text-xs text-muted-foreground font-normal">Chat about your comments</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Chat Messages Area - Scrollable */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="sync">
            {messages.length === 0 ? (
              // Welcome State
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/25">
                    <Sparkle className="w-7 h-7 text-white" fill="white" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">What would you like to know?</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Ask anything about your video comments
                  </p>
                </div>

                {/* Suggested Questions */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground px-1 uppercase tracking-wide">Suggested Questions</p>
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((q, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="group block w-full text-left p-2.5 rounded-lg bg-card hover:bg-red-500/5 border border-border hover:border-red-500/30 transition-all text-xs hover:shadow"
                        disabled={loading}
                      >
                        <span className="text-foreground group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">{q}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              // Chat Messages
              <>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={message.type === 'user' ? 'flex justify-end' : 'flex gap-2'}
                  >
                    {message.type === 'user' ? (
                      // User Message
                      <div className="max-w-[85%]">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg shadow-red-500/20">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      // AI Message
                      <>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                          <Sparkle className="w-4 h-4 text-white" fill="white" />
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="mb-1">
                            <span className="text-[10px] font-medium text-muted-foreground">Lently AI</span>
                          </div>
                          <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                            {renderMessageContent(message.content)}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Loading Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                <Sparkle className="w-4 h-4 text-white" fill="white" />
              </div>
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="border-t border-border p-4 bg-background/50 backdrop-blur-sm shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 ? "Ask a question..." : "Ask a follow-up question..."}
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              disabled={loading}
            />
            <Button
              onClick={handleAskAI}
              disabled={!question.trim() || loading}
              size="icon"
              className="h-[44px] w-[44px] shrink-0 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
