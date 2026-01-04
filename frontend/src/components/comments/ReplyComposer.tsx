/**
 * Reply Composer Dialog
 * Modal for composing and posting replies to comments using templates
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, FileText } from 'lucide-react';
import { useTemplates } from '@/lib/query/templateQueries';
import { usePostReply } from '@/lib/query/replyQueries';
import { Comment } from '@/lib/api/comments';

interface ReplyComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: Comment | null;
}

export default function ReplyComposer({ open, onOpenChange, comment }: ReplyComposerProps) {
  const [replyText, setReplyText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [postToYouTube, setPostToYouTube] = useState(true);

  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const postReply = usePostReply(comment?.id || ''); // Use comment.id (Firestore doc ID)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setReplyText('');
      setSelectedTemplateId('');
      setPostToYouTube(true);
    }
  }, [open]);

  // When template is selected, populate reply text
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId === 'none') {
      setReplyText('');
      return;
    }

    const template = templates?.find((t) => t.replyId === templateId);
    if (template) {
      setReplyText(template.replyText);
    }
  };

  const handlePost = () => {
    if (!replyText.trim() || !comment) return;

    postReply.mutate(
      {
        replyText: replyText.trim(),
        postToYouTube,
        templateId: selectedTemplateId !== 'none' ? selectedTemplateId : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!comment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reply to Comment</DialogTitle>
          <DialogDescription>
            Replying to: <span className="font-medium text-foreground">{comment.author}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original comment */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground line-clamp-3">{comment.text}</p>
          </div>

          {/* Template selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Use a Template (Optional)</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template or write your own" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Write custom reply</span>
                  </div>
                </SelectItem>
                {templatesLoading ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading templates...</span>
                  </SelectItem>
                ) : (
                  templates?.map((template) => (
                    <SelectItem key={template.replyId} value={template.replyId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.question}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {template.replyText}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Reply text */}
          <div className="space-y-2">
            <Label htmlFor="reply">Your Reply</Label>
            <Textarea
              id="reply"
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {replyText.length} / 10000 characters
            </p>
          </div>

          {/* Post to YouTube checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="postToYouTube"
              checked={postToYouTube}
              onCheckedChange={(checked) => setPostToYouTube(checked as boolean)}
            />
            <Label
              htmlFor="postToYouTube"
              className="text-sm font-normal cursor-pointer"
            >
              Post reply to YouTube immediately
            </Label>
          </div>
          {!postToYouTube && (
            <p className="text-xs text-muted-foreground pl-6">
              Reply will be saved as a draft and not posted to YouTube
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePost}
            disabled={!replyText.trim() || postReply.isPending}
          >
            {postReply.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {postToYouTube ? 'Post Reply' : 'Save Draft'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
