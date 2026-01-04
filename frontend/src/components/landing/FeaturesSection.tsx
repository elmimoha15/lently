import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LayoutGrid, 
  TrendingUp, 
  HelpCircle, 
  ShieldAlert, 
  Bell, 
  Sparkles 
} from 'lucide-react';

const features = [
  {
    icon: LayoutGrid,
    title: 'Smart Categorization',
    description: 'Auto-tag feedback, requests, and spam with our AI that learns your content style.',
  },
  {
    icon: TrendingUp,
    title: 'Sentiment Analysis',
    description: 'Real-time emotional tracking of your audience\'s reaction to every video.',
  },
  {
    icon: HelpCircle,
    title: 'Question Extraction',
    description: 'Instantly find every question asked so you never leave fans hanging.',
  },
  {
    icon: ShieldAlert,
    title: 'Toxicity Detection',
    description: 'Protect your community by instantly flagging harmful comments.',
  },
  {
    icon: Bell,
    title: 'Engagement Alerts',
    description: 'Get notified when big news happens in your comments. Never miss a viral moment.',
  },
  {
    icon: Sparkles,
    title: 'AI Replies',
    description: 'Draft professional, brand-safe responses to common questions in seconds.',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-background-secondary" id="features">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            AI That Turns <span className="text-primary">Chaos</span> Into Clarity
          </h2>
          <p className="text-lg text-muted-foreground">
            We built the tools you need to stop guessing and start growing. A complete suite of comment intelligence features.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="feature" className="h-full group">
                <CardContent className="p-6">
                  <div className="p-3 w-fit rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
