import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { useGenerateTemplate } from '@/lib/query/templateQueries';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string;
  videoTitle?: string;
  channelName?: string;
}

export function CreateTemplateDialog({ 
  open, 
  onOpenChange,
  videoId,
  videoTitle,
  channelName
}: CreateTemplateDialogProps) {
  const [question, setQuestion] = useState('');
  const generateMutation = useGenerateTemplate();

  const handleGenerate = async () => {
    if (!question.trim()) return;

    await generateMutation.mutateAsync({
      question: question.trim(),
      videoContext: {
        videoId,
        videoTitle,
        channelName
      }
    });

    // Close dialog and reset on success
    if (!generateMutation.isError) {
      setQuestion('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Enter a common question and AI will generate a professional reply template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="What camera do you use?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Enter a common question from your viewers
            </p>
          </div>

          {videoTitle && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">Context:</p>
              <p className="font-medium">{videoTitle}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!question.trim() || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Template
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
