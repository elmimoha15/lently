import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquareOff, HelpCircle, AlertTriangle, Lightbulb } from 'lucide-react';

const problems = [
  {
    icon: MessageSquareOff,
    tag: 'PROBLEM 01',
    title: '1,000+ comments. Zero insights.',
    description: 'Scrolling endlessly to impossible. You\'re missing patterns and trends buried in your feedback.',
  },
  {
    icon: HelpCircle,
    tag: 'PROBLEM 02',
    title: 'Questions buried. Opportunities lost.',
    description: 'Your content ideas live in your comment section but you\'re too busy to dig them out.',
  },
  {
    icon: AlertTriangle,
    tag: 'PROBLEM 03',
    title: 'Toxic comments spreading unchecked.',
    description: 'Negativity can derail your mental health and destroy your community. You need to catch it early.',
  },
  {
    icon: Lightbulb,
    tag: 'PROBLEM 04',
    title: 'Guessing what content to make next.',
    description: 'Stop guessing. Your audience is telling you exactly what they want in the comments.',
  },
];

export function ProblemSection() {
  return (
    <section className="relative py-24 lg:py-32" id="problem">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left side - Heading */}
          <div className="lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                The Comment Section Is
                <br />
                <span className="text-primary">A Goldmine.</span> You're Missing It.
              </h2>
              <p className="text-lg text-muted-foreground">
                Creators spend hours reading comments but barely scratch the surface. Important feedback, questions, and opportunities slip through every day.
              </p>
            </motion.div>
          </div>

          {/* Right side - Problem cards */}
          <div className="relative">
            {/* WHY? Watermark */}
            <div className="absolute -right-8 top-0 text-[10rem] lg:text-[14rem] font-bold text-muted/20 leading-none select-none pointer-events-none hidden lg:block">
              WHY?
            </div>
            
            <div className="grid gap-4 relative z-10">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.tag}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card variant="feature" className="group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <problem.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-primary font-medium tracking-wider">
                            {problem.tag}
                          </span>
                          <h3 className="text-lg font-semibold text-foreground mt-1 mb-2">
                            {problem.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {problem.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
