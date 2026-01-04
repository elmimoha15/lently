import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Comment } from '@/lib/api/comments';

interface CategoryCardProps {
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

export function CategoryCard({ comments }: CategoryCardProps) {
  const getCategoryPercentage = (category: string) => {
    if (comments.length === 0) return 0;
    const count = comments.filter((c) => c.category === category).length;
    return Math.round((count / comments.length) * 100);
  };

  const categories = ['question', 'praise', 'complaint', 'suggestion', 'spam', 'neutral'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Comments Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {categories.map((category) => {
            const count = comments.filter((c) => c.category === category).length;
            const percentage = getCategoryPercentage(category);
            return (
              <div key={category} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Badge className={`${getCategoryColor(category)} text-xs font-medium px-2.5 py-0.5`} variant="outline">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">{count}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2 bg-muted/50" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
