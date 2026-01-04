import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does the AI analysis work?',
    answer: 'Our AI uses advanced natural language processing to analyze every comment on your videos. It detects sentiment (positive, neutral, negative), categorizes content (questions, feedback, spam, etc.), identifies recurring themes, and extracts actionable insights. The more you use it, the better it understands your audience.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade encryption for all data in transit and at rest. We only access public comment data through the official YouTube API, and we never share your data with third parties. You can delete your data at any time.',
  },
  {
    question: 'When will this launch?',
    answer: 'We\'re currently in private beta with select creators. Join the waitlist to get early access and a lifetime discount. We expect to launch publicly in Q1 2025.',
  },
  {
    question: 'What\'s the early bird discount?',
    answer: 'Waitlist members get 20% off for life on any plan when we launch. Plus, the first 80 users get an additional bonus: free onboarding consultation and priority feature requests.',
  },
  {
    question: 'Can I analyze old videos or just new ones?',
    answer: 'Both! When you connect your channel, we\'ll analyze all historical comments across your entire video library. Moving forward, we automatically sync new comments as they come in.',
  },
  {
    question: 'Do you support multiple channels?',
    answer: 'Yes! Our Business plan supports multiple YouTube channels, perfect for agencies or creators with multiple brands. Pro plan supports a single channel.',
  },
];

export function FAQSection() {
  return (
    <section className="relative py-24 lg:py-32" id="faq">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Got <span className="text-primary">Questions?</span>
          </h2>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg bg-card px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
