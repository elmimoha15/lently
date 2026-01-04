import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Comment } from '@/lib/api/comments';

interface CommentsSectionProps {
  comments: Comment[];
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    question: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    praise: 'bg-green-500/10 text-green-500 border-green-500/20',
    complaint: 'bg-red-500/10 text-red-500 border-red-500/20',
    spam: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    suggestion: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    neutral: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return colors[category] || colors.neutral;
};

const getSentimentEmoji = (score: number) => {
  if (score >= 0.5) return '😊';
  if (score >= 0.2) return '🙂';
  if (score >= -0.2) return '😐';
  if (score >= -0.5) return '😕';
  return '😢';
};

export function CommentsSection({ comments }: CommentsSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'all', label: 'All', count: comments.length },
    { key: 'question', label: 'Questions', count: comments.filter((c) => c.category === 'question').length },
    { key: 'praise', label: 'Praise', count: comments.filter((c) => c.category === 'praise').length },
    { key: 'complaint', label: 'Complaints', count: comments.filter((c) => c.category === 'complaint').length },
    { key: 'suggestion', label: 'Suggestions', count: comments.filter((c) => c.category === 'suggestion').length },
    { key: 'spam', label: 'Spam', count: comments.filter((c) => c.category === 'spam').length },
    { key: 'neutral', label: 'Neutral', count: comments.filter((c) => c.category === 'neutral').length },
  ];

  const filteredComments = comments.filter((comment) => {
    const matchesCategory = categoryFilter === 'all' || comment.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      comment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Comments ({filteredComments.length})</CardTitle>
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant={categoryFilter === cat.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat.key)}
              className="capitalize text-xs"
            >
              {cat.label} ({cat.count})
            </Button>
          ))}
        </div>

        <Separator className="mb-4" />

        {/* Comments List - Scrollable */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No comments found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredComments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-3 rounded-lg border bg-card hover:border-primary/30 transition-all"
              >
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback>{comment.author[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{comment.author}</span>
                        {comment.category && (
                          <Badge className={`${getCategoryColor(comment.category)} text-[10px]`} variant="outline">
                            {comment.category}
                          </Badge>
                        )}
                        {comment.sentimentScore !== undefined && (
                          <span className="text-base">{getSentimentEmoji(comment.sentimentScore)}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-2">{comment.text}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(comment.publishedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {comment.likeCount}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
