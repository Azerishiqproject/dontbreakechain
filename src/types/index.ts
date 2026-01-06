export interface HabitLog {
  date: string; // YYYY-MM-DD formatında
  completed: boolean;
  note?: string; // Opsiyonel not
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
}

export interface Habit {
  habit_id: string;
  user_id: string;
  title: string;
  color: string;
  animation_style: 'liquid_connection' | 'default';
  duration: number; // Toplam gün sayısı
  logs: HabitLog[];
  streak_data: StreakData;
  created_at: string;
  updated_at: string;
}

export type HabitFormData = Omit<Habit, 'habit_id' | 'user_id' | 'logs' | 'streak_data' | 'created_at' | 'updated_at'>;

