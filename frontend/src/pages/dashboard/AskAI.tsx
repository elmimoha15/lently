import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { WelcomeState, ChatView } from '@/components/ask-ai';
import { useVideos } from '@/lib/query/videoQueries';
import { toast } from 'sonner';

interface AIInsight {
  type: 'summary' | 'trend' | 'suggestion' | 'alert';
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
}

export default function AskAI() {
  const [question, setQuestion] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const { data: videosData } = useVideos();

  const videos = Array.isArray(videosData) ? videosData : [];
  const creatorName = videos[0]?.channelTitle?.split(' ')[0] || 'Creator';

  const handleAskAI = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setLoading(true);
    
    // Simulate API call - TODO: Replace with actual API
    setTimeout(() => {
      // Generate a comprehensive, well-formatted response
      const mockResponse = `📊 Comment Insights (Last 30 Days)
Analyzed: 1,842 comments across 12 videos

🔍 Overall Sentiment

• Positive: 61%
• Neutral: 23%
• Negative: 16%

💬 What People Are Saying

👍 Positive Themes
• "This finally makes sense, thanks for explaining it simply."
• Viewers appreciate clear explanations and practical examples
• Many mention they watched till the end or replayed sections
• High praise for your teaching style and presentation quality

😐 Neutral / Informational
• Asking for timestamps
• Clarifying tools used or links mentioned
• General statements like "Good video" or "Interesting"
• Questions about equipment and setup

👎 Negative / Friction Points
• "You talked too fast in the middle."
• "Can you show the full setup instead of skipping steps?"
• Some confusion around advanced steps without enough context
• A few mentions of audio quality issues in recent videos

❓ Most Common Questions

• "Can you make a beginner version of this?" (34 times)
• "Does this work in 2025?" (27 times)
• "Can you share the GitHub / template?" (23 times)
• "What software are you using?" (19 times)

🔁 Content Requests

• Step-by-step tutorials for beginners
• Real-world use cases and practical applications
• Follow-up video expanding one specific part
• Behind-the-scenes workflow and tools

⚠️ Repeating Complaint

Viewers want on-screen summaries or recaps at the end

💡 Insight:
Your audience likes what you teach, but wants it slower, more structured, and more beginner-friendly. Consider creating a "fundamentals" series to address the gap.`;

      const mockInsights: AIInsight[] = [
        {
          type: 'summary',
          title: question, // Store the original question
          content: mockResponse,
          icon: <Sparkle className="w-5 h-5" />,
          color: 'text-red-500',
        },
      ];

      setInsights(mockInsights);
      setLoading(false);
      setQuestion(''); // Clear the input field for follow-up questions
      toast.success('Analysis complete!');
    }, 2000);
  };

  const handleNewChat = () => {
    setInsights([]);
    setQuestion('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {insights.length === 0 ? (
              <WelcomeState
                creatorName={creatorName}
                question={question}
                loading={loading}
                videos={videos}
                selectedVideo={selectedVideo}
                onQuestionChange={setQuestion}
                onVideoChange={setSelectedVideo}
                onSuggestedClick={setQuestion}
                onSubmit={handleAskAI}
              />
            ) : (
              <ChatView
                insights={insights}
                question={question}
                loading={loading}
                onQuestionChange={setQuestion}
                onSubmit={handleAskAI}
                onNewChat={handleNewChat}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
