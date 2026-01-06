'use client';

import { motion } from 'framer-motion';

interface ChainLinkProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  isActive: boolean;
}

export default function ChainLink({ fromX, fromY, toX, toY, color, isActive }: ChainLinkProps) {
  if (!isActive) return null;

  const path = `M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${(fromY + toY) / 2 - 10} ${toX} ${toY}`;

  return (
    <motion.svg
      className="pointer-events-none absolute inset-0 z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
        }}
      />
    </motion.svg>
  );
}

