import { motion } from 'framer-motion';
import { Gamepad2, Camera, GraduationCap, DollarSign } from 'lucide-react';

const categories = [
  { icon: Gamepad2, label: 'GAMING' },
  { icon: Camera, label: 'LIFESTYLE' },
  { icon: GraduationCap, label: 'EDUCATION' },
  { icon: DollarSign, label: 'FINANCE' },
];

export function SocialProofSection() {
  return (
    <section className="relative py-16 lg:py-24 border-y border-border bg-background-secondary">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground mb-2">
            JOINING <span className="text-primary font-semibold">529+</span> CREATORS
          </p>
          <h3 className="text-xl font-semibold text-foreground">ON THE WAITLIST</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 lg:gap-16"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="p-4 rounded-xl bg-card border border-border group-hover:border-primary/50 transition-colors">
                <category.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground tracking-wider">{category.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
