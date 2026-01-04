import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useUpdateTemplate } from '@/lib/query/templateQueries';
import { Template } from '@/lib/api/templates';

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

export function EditTemplateDialog({ open, onOpenChange, template }: EditTemplateDialogProps) {
  const [replyText, setReplyText] = useState('');
  const updateMutation = useUpdateTemplate();

  useEffect(() => {
    if (template) {
      setReplyText(template.replyText);
    }
  }, [template]);

  const handleSave = async () => {
    if (!template || !replyText.trim()) return;

    await updateMutation.mutateAsync({
      replyId: template.replyId,
      replyText: replyText.trim()
    });

    // Close dialog on success
    if (!updateMutation.isError) {
      onOpenChange(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Question: {template.question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="replyText">Reply Text</Label>
            <Textarea
              id="replyText"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {replyText.length} characters
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              Used {template.useCount} times • Asked {template.timesAsked} times
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!replyText.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
