import { motion } from 'framer-motion';
import { Sparkle } from 'lucide-react';

interface ChatMessageProps {
  type: 'user' | 'ai';
  content: string;
  delay?: number;
}

export function ChatMessage({ type, content, delay = 0 }: ChatMessageProps) {
  if (type === 'user') {
    return (
      <div className="flex gap-4 justify-end">
        <div className="max-w-[85%]">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <span className="text-sm font-medium text-foreground">You</span>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl rounded-tr-md px-5 py-4 shadow-lg shadow-red-500/20">
            <p className="text-[15px] leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex gap-4"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/25">
        <Sparkle className="w-5 h-5 text-white" fill="white" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="mb-2">
          <span className="text-sm font-medium text-foreground">Lently AI</span>
        </div>
        <div className="bg-card border border-border rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
          <div className="text-[15px] leading-relaxed text-foreground space-y-4">
            {content.split('\n\n').map((section, idx) => {
              const lines = section.split('\n').filter((line) => line.trim());

              return (
                <div key={idx} className="space-y-2">
                  {lines.map((line, lineIdx) => {
                    // Check if line starts with emoji (section header)
                    if (line.match(/^[🔍💬👍😐👎❓🔁⚠️💡📊]/)) {
                      return (
                        <h3 key={lineIdx} className="text-base font-semibold text-foreground mt-5 mb-2 first:mt-0">
                          {line}
                        </h3>
                      );
                    }
                    // Check if it's a bullet point
                    if (line.startsWith('• ')) {
                      return (
                        <div key={lineIdx} className="flex gap-2 ml-2">
                          <span className="text-muted-foreground shrink-0">•</span>
                          <span className="text-muted-foreground">{line.substring(2)}</span>
                        </div>
                      );
                    }
                    // Check if it's a quoted comment
                    if (line.includes('"')) {
                      return (
                        <p key={lineIdx} className="text-muted-foreground italic ml-2 border-l-2 border-red-500/30 pl-3">
                          {line}
                        </p>
                      );
                    }
                    // Regular text
                    return (
                      <p key={lineIdx} className="text-muted-foreground">
                        {line}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
