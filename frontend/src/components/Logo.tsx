import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import lentlyLogo from '@/assets/lently-logo.png';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2"
      >
        <img src={lentlyLogo} alt="Lently" className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-foreground">
          Len<span className="text-primary">tly</span>
        </span>
      </motion.div>
    </Link>
  );
}