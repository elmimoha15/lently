import { motion } from 'framer-motion';
import { HelpCircle, MessageSquare, Check, Sparkles, Video } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/stores/useStore';

export default function Questions() {
  const { questions } = useStore();

  const unansweredCount = questions.filter(q => !q.isAnswered).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Questions</h1>
            <p className="text-muted-foreground">{unansweredCount} unanswered of {questions.length} total</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Unanswered', 'Answered', 'Most Asked'].map((filter) => (
            <Button key={filter} variant="outline" size="sm">
              {filter}
            </Button>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 shrink-0">
                      <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-foreground">{question.text}</h3>
                        <Badge variant="secondary" className="shrink-0">
                          Asked {question.count}x
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {question.videoIds.slice(0, 3).map((videoId, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            Video {videoId}
                          </Badge>
                        ))}
                        {question.videoIds.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{question.videoIds.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {question.sampleCommentIds.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground italic">Sample comment available</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <Button variant="hero" size="sm">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate Reply
                        </Button>
                        {!question.isAnswered ? (
                          <Button variant="outline" size="sm">
                            <Check className="w-4 h-4 mr-1" />
                            Mark Answered
                          </Button>
                        ) : (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Video className="w-4 h-4 mr-1" />
                          Create Video Idea
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No questions yet</h3>
            <p className="text-muted-foreground">Questions from your viewers will appear here.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
