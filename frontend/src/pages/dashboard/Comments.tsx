import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, ThumbsUp, Flag, Reply, MoreVertical, Loader2, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useComments } from '@/hooks/useComments';
import { toast } from 'sonner';
import ReplyComposer from '@/components/comments/ReplyComposer';
import type { Comment } from '@/lib/api/comments';

export default function Comments() {
  const { comments, loading, error, total, refresh, applyFilters } = useComments();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  const categories = ['all', 'question', 'praise', 'complaint', 'spam', 'suggestion', 'neutral'];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters({
      search: query || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    applyFilters({
      search: searchQuery || undefined,
      category: category !== 'all' ? category : undefined,
    });
  };

  const handleReplyWithAI = (comment: Comment) => {
    setSelectedComment(comment);
    setReplyDialogOpen(true);
  };

  const getSentimentEmoji = (sentiment?: number) => {
    if (!sentiment) return '😐';
    if (sentiment >= 0.5) return '😊';
    if (sentiment >= 0) return '😐';
    return '😢';
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-muted text-muted-foreground';
    switch (category) {
      case 'question': return 'bg-blue-500/20 text-blue-400';
      case 'praise': return 'bg-green-500/20 text-green-400';
      case 'complaint': return 'bg-red-500/20 text-red-400';
      case 'spam': return 'bg-gray-500/20 text-gray-400';
      case 'suggestion': return 'bg-purple-500/20 text-purple-400';
      case 'neutral': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comments</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${total} total comment${total === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Failed to Load Comments</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refresh}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && comments.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">No Comments Yet</h2>
                <p className="text-muted-foreground">
                  Analyze a video to see comments here
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments Content */}
        {!loading && !error && comments.length > 0 && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{comment.author}</span>
                          <Badge className={getCategoryColor(comment.category)} variant="secondary">
                            {comment.category}
                          </Badge>
                          <span className="text-lg">{getSentimentEmoji(comment.sentimentScore)}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-foreground mt-2">{comment.text}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span>{comment.publishedAt}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {comment.likeCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleReplyWithAI(comment)}>
                          <Reply className="w-4 h-4 mr-1" />
                          Reply
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Flag className="w-4 h-4 mr-1" />
                          Flag
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Reply Composer Dialog */}
      <ReplyComposer
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        comment={selectedComment}
      />
    </DashboardLayout>
  );
}
