import { motion } from 'framer-motion';
import { Youtube, Cpu, LineChart } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Youtube,
    title: 'Connect YouTube',
    description: 'Link your channel. We scan your historical data and sync all comments.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Analyzes Comments',
    description: 'Our engine reads every comment for sentiment, topics, and recurring themes.',
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Get Actionable Insights',
    description: 'Detailed reports, AI-generated replies, and data-driven content strategy at your fingertips.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-24 lg:py-32" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            HOW IT <span className="text-primary">WORKS</span>
          </h2>
        </motion.div>

        {/* Steps - Zigzag layout */}
        <div className="max-w-4xl mx-auto space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`flex flex-col md:flex-row items-center gap-8 ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Icon */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center group hover:border-primary/50 transition-colors">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className={`text-center md:text-left flex-1 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {step.description}
                </p>
              </div>

              {/* Connecting line (hidden on mobile, shown between items) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-1/2 h-16 w-px bg-border -translate-x-1/2" style={{ top: `calc(${(index + 1) * 33}% + 2rem)` }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
