'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { SiBnbchain } from 'react-icons/si';
import { format, addDays, parseISO, isPast } from 'date-fns';
import { useHabitStore } from '@/store/habitStore';
import HabitForm from './HabitForm';
import { Habit } from '@/types';
import { calculateStreakByDays, isCompletedOnDate } from '@/utils/streak';

type HabitCategory = 'active' | 'completed' | 'incomplete';

function categorizeHabit(habit: Habit): HabitCategory {
  const completedCount = habit.logs.filter(l => l.completed).length;
  const totalDays = habit.duration;
  
  // Tamamen tamamlanmış
  if (completedCount === totalDays) {
    return 'completed';
  }
  
  // Son günü kontrol et
  const startDate = parseISO(habit.created_at);
  const lastDay = addDays(startDate, totalDays - 1);
  const lastDayStr = format(lastDay, 'yyyy-MM-dd');
  const isLastDayCompleted = isCompletedOnDate(habit.logs, lastDayStr);
  
  // Son güne check atılmışsa ama %100 dolmamışsa -> tamamlanmamış
  if (isLastDayCompleted && completedCount < totalDays) {
    return 'incomplete';
  }
  
  // Süre dolmuş mu kontrol et
  const endDate = addDays(startDate, totalDays);
  const isExpired = isPast(endDate);
  
  // Süre dolmuş ama tamamlanmamış
  if (isExpired) {
    return 'incomplete';
  }
  
  // Devam ediyor
  return 'active';
}

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const { habits, loading, fetchHabits, subscribeToHabits } = useHabitStore();
  const router = useRouter();

  useEffect(() => {
    fetchHabits();
    const unsubscribe = subscribeToHabits();
    return () => unsubscribe();
  }, [fetchHabits, subscribeToHabits]);

  // Alışkanlıkları kategorize et
  const categorizedHabits = useMemo(() => {
    const active: Habit[] = [];
    const completed: Habit[] = [];
    const incomplete: Habit[] = [];

    habits.forEach(habit => {
      const category = categorizeHabit(habit);
      if (category === 'active') {
        active.push(habit);
      } else if (category === 'completed') {
        completed.push(habit);
      } else {
        incomplete.push(habit);
      }
    });

    return { active, completed, incomplete };
  }, [habits]);

  if (loading && habits.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-slate-400 allura-regular">Loading...</div>
      </div>
    );
  }

  const renderHabitCard = (habit: Habit, index: number) => {
    const completedCount = habit.logs.filter(l => l.completed).length;
    const progress = (completedCount / habit.duration) * 100;

    // Gün numaralarına göre streak hesapla
    const startDate = parseISO(habit.created_at);
    const days = Array.from({ length: habit.duration }, (_, i) => {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        dayNumber: i + 1,
        completed: isCompletedOnDate(habit.logs, dateStr),
      };
    });
    const streakData = calculateStreakByDays(days);

    return (
      <motion.div
        key={habit.habit_id}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{
          delay: index * 0.05,
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push(`/habit/${habit.habit_id}`)}
        className="relative cursor-pointer"
      >
        <div
          className="flex h-32 w-32 items-center justify-center rounded-full shadow-xl transition-all hover:shadow-2xl relative overflow-visible"
          style={{
            backgroundColor: habit.color,
            boxShadow: `0 0 30px ${habit.color}80, 0 10px 40px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Glow efekti */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${habit.color} 0%, transparent 70%)`,
              filter: 'blur(20px)',
              opacity: 0.6,
              zIndex: -1,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="text-center z-10">
            <p className="px-4 text-sm font-bold text-white drop-shadow-lg allura-regular">
              {habit.title}
            </p>
            <p className="mt-2 text-xs text-white/90 allura-regular">
              {streakData.current_streak} 🔥
            </p>
          </div>

          {/* Progress ring */}
          <svg className="absolute inset-0 -rotate-90" width="128" height="128">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 60}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center justify-center text-center"
        >
          <h1 className="mb-4 text-5xl font-black tracking-tight text-white uppercase italic tracking-wider allura-regular flex items-center justify-center gap-3">
            <SiBnbchain className="text-indigo-400" size={48} />
            Don't Break the Chain
          </h1>
          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={16} className="animate-pulse text-indigo-400" />
              <p className="text-lg text-slate-400 allura-regular">
                Track your habits, don't break the chain!
              </p>
            </div>
            <p className="text-base italic text-slate-500 max-w-2xl allura-regular">
              "The chains of habit are too light to be felt until they are too heavy to be broken."
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-full bg-indigo-600/80 backdrop-blur-md px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-indigo-600 hover:shadow-indigo-500/50 border border-white/20 allura-regular"
          >
            <Plus size={20} />
            New Habit
          </motion.button>
        </motion.div>

        {/* Habits - Kategorize edilmiş */}
        {habits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel rounded-2xl p-12 text-center"
          >
            <p className="text-xl text-slate-400 allura-regular">
              No habits added yet. Start by adding your first habit! 🚀
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Devam Edenler */}
            {categorizedHabits.active.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <Clock size={24} className="text-indigo-400" />
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-wider allura-regular">
                    Active
                  </h2>
                  <span className="ml-auto rounded-full bg-indigo-600/20 backdrop-blur-sm px-3 py-1 text-sm text-indigo-300 border border-indigo-400/30 allura-regular">
                    {categorizedHabits.active.length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8">
                  <AnimatePresence>
                    {categorizedHabits.active.map((habit, index) => renderHabitCard(habit, index))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Tamamlananlar */}
            {categorizedHabits.completed.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel rounded-2xl p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-400" />
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-wider allura-regular">
                    Completed
                  </h2>
                  <span className="ml-auto rounded-full bg-green-600/20 backdrop-blur-sm px-3 py-1 text-sm text-green-300 border border-green-400/30 allura-regular">
                    {categorizedHabits.completed.length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8">
                  <AnimatePresence>
                    {categorizedHabits.completed.map((habit, index) => renderHabitCard(habit, index))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Bitmiş Ama Boşluklar Kalmış */}
            {categorizedHabits.incomplete.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel rounded-2xl p-8 opacity-60"
              >
                <div className="mb-6 flex items-center gap-3">
                  <AlertCircle size={24} className="text-amber-400" />
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-wider allura-regular">
                    Incomplete
                  </h2>
                  <span className="ml-auto rounded-full bg-amber-600/20 backdrop-blur-sm px-3 py-1 text-sm text-amber-300 border border-amber-400/30 allura-regular">
                    {categorizedHabits.incomplete.length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8">
                  <AnimatePresence>
                    {categorizedHabits.incomplete.map((habit, index) => renderHabitCard(habit, index))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Habit Form Modal */}
        <AnimatePresence>
          {showForm && <HabitForm onClose={() => setShowForm(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
