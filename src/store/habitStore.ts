import { create } from 'zustand';
import { Habit, HabitLog } from '@/types';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateStreak } from '@/utils/streak';

interface HabitStore {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchHabits: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'habit_id' | 'user_id' | 'logs' | 'streak_data' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleDay: (habitId: string, date: string, note?: string) => Promise<void>;
  subscribeToHabits: () => () => void;
}

const USER_ID = 'single_user'; // Tek kullanıcı için sabit ID

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  loading: false,
  error: null,

  fetchHabits: async () => {
    set({ loading: true, error: null });
    try {
      const habitsRef = collection(db, 'habits');
      const q = query(habitsRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      
      const habits: Habit[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        habits.push({
          ...data,
          habit_id: doc.id,
          duration: data.duration || 30, // Eski alışkanlıklar için default 30 gün
        } as Habit);
      });

      // Streak'leri hesapla
      const habitsWithStreaks = habits.map(habit => {
        const streakData = calculateStreak(habit.logs);
        return {
          ...habit,
          streak_data: streakData
        };
      });

      set({ habits: habitsWithStreaks, loading: false });
    } catch (error) {
      console.error('Error fetching habits:', error);
      set({ error: 'Habitler yüklenirken hata oluştu', loading: false });
    }
  },

  addHabit: async (habitData) => {
    set({ loading: true, error: null });
    try {
      const newHabit: Omit<Habit, 'habit_id'> = {
        ...habitData,
        user_id: USER_ID,
        logs: [],
        streak_data: { current_streak: 0, longest_streak: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const habitsRef = collection(db, 'habits');
      await addDoc(habitsRef, newHabit);
      
      await get().fetchHabits();
    } catch (error) {
      console.error('Error adding habit:', error);
      set({ error: 'Habit eklenirken hata oluştu', loading: false });
    }
  },

  updateHabit: async (habitId, updates) => {
    set({ loading: true, error: null });
    try {
      const habitRef = doc(db, 'habits', habitId);
      await updateDoc(habitRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      
      await get().fetchHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      set({ error: 'Habit güncellenirken hata oluştu', loading: false });
    }
  },

  deleteHabit: async (habitId) => {
    set({ loading: true, error: null });
    try {
      const habitRef = doc(db, 'habits', habitId);
      await deleteDoc(habitRef);
      
      await get().fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      set({ error: 'Habit silinirken hata oluştu', loading: false });
    }
  },

  toggleDay: async (habitId, date, note) => {
    set({ loading: true, error: null });
    try {
      const habit = get().habits.find(h => h.habit_id === habitId);
      if (!habit) return;

      const existingLogIndex = habit.logs.findIndex(log => log.date === date);
      let newLogs: HabitLog[];

      if (existingLogIndex >= 0) {
        // Log varsa toggle yap ve notu güncelle
        newLogs = habit.logs.map((log, index) =>
          index === existingLogIndex
            ? { ...log, completed: !log.completed, note: note !== undefined ? note : log.note }
            : log
        );
      } else {
        // Log yoksa yeni ekle
        newLogs = [...habit.logs, { date, completed: true, note: note || undefined }];
      }

      // Streak'i hesapla
      const streakData = calculateStreak(newLogs);

      const habitRef = doc(db, 'habits', habitId);
      await updateDoc(habitRef, {
        logs: newLogs,
        streak_data: streakData,
        updated_at: new Date().toISOString(),
      });

      // Haptic feedback (mobil cihazlarda)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      await get().fetchHabits();
    } catch (error) {
      console.error('Error toggling day:', error);
      set({ error: 'Gün işaretlenirken hata oluştu', loading: false });
    }
  },

  subscribeToHabits: () => {
    const habitsRef = collection(db, 'habits');
    const q = query(habitsRef, orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habits: Habit[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const streakData = calculateStreak(data.logs as HabitLog[]);
        habits.push({
          ...data,
          habit_id: doc.id,
          duration: data.duration || 30, // Eski alışkanlıklar için default 30 gün
          streak_data: streakData,
        } as Habit);
      });
      set({ habits });
    }, (error) => {
      console.error('Error in subscription:', error);
      set({ error: 'Real-time güncelleme hatası' });
    });

    return unsubscribe;
  },
}));

