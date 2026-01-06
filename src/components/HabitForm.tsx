'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useHabitStore } from '@/store/habitStore';
import { X } from 'lucide-react';

const COLORS = [
  '#4F46E5', // Indigo
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export default function HabitForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [duration, setDuration] = useState(30);
  const addHabit = useHabitStore((state) => state.addHabit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || duration < 1) return;

    await addHabit({
      title: title.trim(),
      color,
      animation_style: 'liquid_connection',
      duration: duration,
    });

    setTitle('');
    setDuration(30);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-wider allura-regular">
            Add New Habit
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400 allura-regular">
              Habit Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g.: Code for 30 minutes daily"
              className="w-full rounded-xl border border-white/18 bg-white/5 backdrop-blur-md px-4 py-3 text-white placeholder:text-slate-400 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 allura-regular"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400 allura-regular">
              How Many Days?
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-full rounded-xl border border-white/18 bg-white/5 backdrop-blur-md px-4 py-3 text-white focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 allura-regular"
            />
            <p className="mt-2 text-xs text-slate-500 allura-regular">
              You'll track this habit for {duration} days
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400 allura-regular">
              Color
            </label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-12 w-12 rounded-full transition-all hover:scale-110 ${
                    color === c ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-indigo-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/18 bg-white/5 backdrop-blur-md px-6 py-3 font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white allura-regular"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 rounded-xl px-6 py-3 font-medium text-white transition-all shadow-lg hover:shadow-xl allura-regular"
              style={{ backgroundColor: color }}
            >
              Add
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
