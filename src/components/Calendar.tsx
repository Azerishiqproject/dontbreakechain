'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addDays, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Habit } from '@/types';
import { useHabitStore } from '@/store/habitStore';
import { isCompletedOnDate } from '@/utils/streak';
import ChainLink from './ChainLink';

interface CalendarProps {
  habit: Habit;
}

export default function Calendar({ habit }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const toggleDay = useHabitStore((state) => state.toggleDay);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Önceki ayın son günlerini ekle (takvimi doldurmak için)
  const firstDayOfWeek = monthStart.getDay();
  const daysBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const previousDays = Array.from({ length: daysBefore }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - daysBefore + i);
    return date;
  });

  // Sonraki ayın ilk günlerini ekle
  const totalDays = daysBefore + daysInMonth.length;
  const daysAfter = 42 - totalDays; // 6 hafta x 7 gün = 42
  const nextDays = Array.from({ length: daysAfter }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...previousDays, ...daysInMonth, ...nextDays];

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    toggleDay(habit.habit_id, dateStr);
  };

  const getDayState = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completed = isCompletedOnDate(habit.logs, dateStr);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isTodayDate = isToday(date);

    // Önceki ve sonraki günleri kontrol et
    const prevDate = subDays(date, 1);
    const nextDate = addDays(date, 1);
    const prevDateStr = format(prevDate, 'yyyy-MM-dd');
    const nextDateStr = format(nextDate, 'yyyy-MM-dd');
    const prevCompleted = isCompletedOnDate(habit.logs, prevDateStr);
    const nextCompleted = isCompletedOnDate(habit.logs, nextDateStr);

    return {
      completed,
      isCurrentMonth,
      isTodayDate,
      dateStr,
      hasConnectionBefore: prevCompleted && completed,
      hasConnectionAfter: completed && nextCompleted,
    };
  };

  const handleDelete = async () => {
    await deleteHabit(habit.habit_id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900">
      {/* Habit Title & Delete */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50" style={{ color: habit.color }}>
          {habit.title}
        </h2>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
          title="Alışkanlığı sil"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
          >
            <p className="mb-2 text-sm text-red-800 dark:text-red-200">
              Bu alışkanlığı silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                İptal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {format(currentMonth, 'MMMM yyyy', { locale: tr })}
        </h3>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="relative grid grid-cols-7 gap-1">
        {allDays.map((date, index) => {
          const state = getDayState(date);
          const row = Math.floor(index / 7);
          const col = index % 7;

          return (
            <motion.button
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`relative h-10 w-10 rounded-lg text-sm font-medium transition-all ${
                !state.isCurrentMonth
                  ? 'text-zinc-300 dark:text-zinc-700'
                  : state.completed
                  ? 'text-white'
                  : 'text-zinc-700 dark:text-zinc-300'
              } ${
                state.isTodayDate && !state.completed
                  ? 'ring-2 ring-indigo-500'
                  : ''
              }`}
              style={{
                backgroundColor: state.completed ? habit.color : 'transparent',
                border: state.completed ? 'none' : `2px solid ${state.isCurrentMonth ? '#e4e4e7' : 'transparent'}`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.01 }}
            >
              {state.completed && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  style={{ backgroundColor: habit.color }}
                />
              )}
              <span className="relative z-10">{format(date, 'd')}</span>

              {/* Streak indicator for 7+ days */}
              {habit.streak_data.current_streak >= 7 && state.completed && (
                <motion.div
                  className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Chain links - basit versiyon, daha sonra geliştirilebilir */}
        {allDays.map((date, index) => {
          const state = getDayState(date);
          if (!state.hasConnectionAfter) return null;

          const nextIndex = index + 1;
          if (nextIndex >= allDays.length) return null;

          const row = Math.floor(index / 7);
          const col = index % 7;
          const nextRow = Math.floor(nextIndex / 7);
          const nextCol = nextIndex % 7;

          // Sadece aynı satırdaki komşu günler için
          if (row === nextRow && nextCol === col + 1) {
            const fromX = (col + 1) * 42 + 20;
            const fromY = (row + 1) * 42 + 20;
            const toX = (nextCol + 1) * 42 + 20;
            const toY = (nextRow + 1) * 42 + 20;

            return (
              <ChainLink
                key={`link-${index}`}
                fromX={fromX}
                fromY={fromY}
                toX={toX}
                toY={toY}
                color={habit.color}
                isActive={state.hasConnectionAfter}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Streak info */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Mevcut Seri</p>
          <p className="text-2xl font-bold" style={{ color: habit.color }}>
            {habit.streak_data.current_streak} 🔥
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">En Uzun Seri</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {habit.streak_data.longest_streak} ⭐
          </p>
        </div>
      </div>
    </div>
  );
}

