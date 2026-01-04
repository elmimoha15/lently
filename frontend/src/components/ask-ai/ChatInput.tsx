import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  value: string;
  loading: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatInput({
  value,
  loading,
  placeholder = "Ask a follow-up question...",
  onChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pt-4 pb-4"
    >
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="relative flex items-center">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-4 pr-16 py-4 rounded-2xl resize-none min-h-[64px] max-h-[120px] bg-card border-border hover:border-red-500/30 focus:border-red-500/50 transition-colors text-base leading-relaxed"
            style={{ textAlign: 'left' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <Button
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </motion.div>
  );
}
