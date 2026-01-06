import { HabitLog } from '@/types';
import { format, parseISO, isSameDay, addDays, subDays } from 'date-fns';

/**
 * Ardışık günleri hesaplar (tarih bazlı)
 */
export function calculateStreak(logs: HabitLog[]): { current_streak: number; longest_streak: number } {
  if (logs.length === 0) {
    return { current_streak: 0, longest_streak: 0 };
  }

  // Sadece tamamlanan logları al ve tarihe göre sırala
  const completedLogs = logs
    .filter(log => log.completed)
    .map(log => parseISO(log.date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (completedLogs.length === 0) {
    return { current_streak: 0, longest_streak: 0 };
  }

  // En son tamamlanan günü bul
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = subDays(today, 1);
  yesterday.setHours(0, 0, 0, 0);

  const lastCompletedDate = completedLogs[completedLogs.length - 1];
  lastCompletedDate.setHours(0, 0, 0, 0);

  // Current streak hesaplama
  let currentStreak = 0;
  
  // Bugün veya dün tamamlanmışsa streak devam ediyor
  if (isSameDay(lastCompletedDate, today) || isSameDay(lastCompletedDate, yesterday)) {
    currentStreak = 1;
    let checkDate = subDays(lastCompletedDate, 1);
    
    // Geriye doğru ardışık günleri kontrol et
    while (true) {
      const found = completedLogs.some(log => isSameDay(log, checkDate));
      if (found) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  }

  // Longest streak hesaplama
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < completedLogs.length; i++) {
    const prevDate = completedLogs[i - 1];
    const currDate = completedLogs[i];
    
    if (isSameDay(currDate, addDays(prevDate, 1))) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak
  };
}

/**
 * Gün numaralarına göre streak hesaplar (alışkanlık bazlı)
 * days: [{ dayNumber: 1, dateStr: '2024-01-01', completed: true }, ...]
 */
export function calculateStreakByDays(days: Array<{ dayNumber: number; completed: boolean }>): { current_streak: number; longest_streak: number } {
  if (days.length === 0) {
    return { current_streak: 0, longest_streak: 0 };
  }

  // Current streak: En son tamamlanan günden geriye doğru ardışık tamamlanan günler
  let currentStreak = 0;
  
  // En son tamamlanan günü bul
  let lastCompletedIndex = -1;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].completed) {
      lastCompletedIndex = i;
      break;
    }
  }

  if (lastCompletedIndex >= 0) {
    // Geriye doğru ardışık tamamlanan günleri say
    for (let i = lastCompletedIndex; i >= 0; i--) {
      if (days[i].completed) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak hesaplama
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < days.length; i++) {
    if (days[i].completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak
  };
}

/**
 * İki tarihin ardışık olup olmadığını kontrol eder
 */
export function isConsecutive(date1: string, date2: string): boolean {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  return isSameDay(d2, addDays(d1, 1)) || isSameDay(d1, addDays(d2, 1));
}

/**
 * Belirli bir tarihte tamamlanmış mı kontrol eder
 */
export function isCompletedOnDate(logs: HabitLog[], date: string): boolean {
  return logs.some(log => log.date === date && log.completed);
}
