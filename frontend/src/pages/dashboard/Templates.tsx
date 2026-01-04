import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit, Copy, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreateTemplateDialog } from '@/components/templates/CreateTemplateDialog';
import { EditTemplateDialog } from '@/components/templates/EditTemplateDialog';
import { useTemplates, useDeleteTemplate, useMarkTemplateUsed } from '@/lib/query/templateQueries';
import { Template, TemplatesResponse } from '@/lib/api/templates';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Templates() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const { data, isLoading, error } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const markUsedMutation = useMarkTemplateUsed();

  const templatesData = data as TemplatesResponse | undefined;
  const templates = templatesData?.replies || [];

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handleCopy = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.replyText);
      toast.success('Reply copied to clipboard!');
      // Mark as used
      markUsedMutation.mutate(template.replyId);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    await deleteMutation.mutateAsync(templateToDelete.replyId);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Response Templates</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : `${templates.length} template${templates.length !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          <Button variant="hero" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Loading State - Only show when there's no data at all */}
        {isLoading && templates.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && templates.length === 0 && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Failed to load templates</h3>
            <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
          </div>
        )}

        {/* Templates Grid - Show immediately if we have cached data */}
        {templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.replyId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground line-clamp-2">{template.question}</h3>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {template.timesAsked}x asked
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-4">
                      {template.replyText}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Used {template.useCount} times
                      </span>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(template)}
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleCopy(template)}
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(template)}
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create reusable response templates to reply faster.</p>
            <Button variant="hero" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateTemplateDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
      
      <EditTemplateDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        template={selectedTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
              {templateToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  "{templateToDelete.question}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
