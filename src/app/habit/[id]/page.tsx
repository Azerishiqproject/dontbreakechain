'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format, addDays, parseISO } from 'date-fns';
import { ChevronLeft, Zap, Target, Sparkles, Trash2, FileText, X } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';
import { isCompletedOnDate, calculateStreakByDays } from '@/utils/streak';

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const habitId = params.id as string;
  const { habits, fetchHabits, subscribeToHabits, toggleDay, deleteHabit } = useHabitStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(800);
  const [clickedDay, setClickedDay] = useState<number | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);
  const [noteModal, setNoteModal] = useState<{ dayNumber: number; dateStr: string; note: string } | null>(null);

  const habit = habits.find((h) => h.habit_id === habitId);

  useEffect(() => {
    fetchHabits();
    const unsubscribe = subscribeToHabits();
    return () => unsubscribe();
  }, [fetchHabits, subscribeToHabits]);

  // Container genişliğini ve boyutunu hesapla
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width - 64); // padding için
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateSize();
    const timer = setTimeout(updateSize, 150);
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, [habit]);

  // Alışkanlık oluşturulma tarihinden itibaren duration kadar gün oluştur
  const startDate = habit ? parseISO(habit.created_at) : new Date();
  const days = useMemo(() => {
    if (!habit) return [];
    return Array.from({ length: habit.duration }, (_, i) => {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date,
        dateStr,
        dayNumber: i + 1,
        completed: isCompletedOnDate(habit.logs, dateStr),
      };
    });
  }, [habit?.duration, habit?.created_at, habit?.logs, startDate]);

  // Streak'i gün numaralarına göre hesapla
  const streakData = useMemo(() => {
    if (!habit || days.length === 0) {
      return { current_streak: 0, longest_streak: 0 };
    }
    return calculateStreakByDays(days);
  }, [days, habit]);

  // Tüm günler tamamlanmış mı kontrol et
  const isFullyCompleted = useMemo(() => {
    if (!habit || days.length === 0) return false;
    return days.every(day => day.completed);
  }, [days, habit]);

  const handleDayClick = (dayNumber: number) => {
    if (!habit) return;
    const day = days[dayNumber - 1];
    if (!day) return;
    
    // Not modal'ını aç
    const existingLog = habit.logs.find(log => log.date === day.dateStr);
    setNoteModal({
      dayNumber,
      dateStr: day.dateStr,
      note: existingLog?.note || '',
    });
  };

  const handleSaveNote = async () => {
    if (!habit || !noteModal) return;
    
    // Eğer tamamlanmamışsa, tatmin edici animasyon göster
    const day = days[noteModal.dayNumber - 1];
    if (!day || !day.completed) {
      setClickedDay(noteModal.dayNumber);
      
      // Partikül efekti oluştur
      const dayElement = document.getElementById(`day-${noteModal.dayNumber}`);
      if (dayElement && containerRef.current) {
        const rect = dayElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Container'a göre relative pozisyon (2px sola, 2px yukarı)
        const centerX = rect.left - containerRect.left + rect.width / 2 - 6;
        const centerY = rect.top - containerRect.top + rect.height / 2 - 6;
        
        // 12 partikül oluştur (her yöne)
        const newParticles = Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 360) / 12;
          return {
            id: Date.now() + i,
            x: centerX,
            y: centerY,
            angle: angle * (Math.PI / 180),
          };
        });
        setParticles(newParticles);
        
        // Partikülleri temizle
        setTimeout(() => setParticles([]), 1000);
        setTimeout(() => setClickedDay(null), 600);
      }
    }
    
    // Notu kaydet ve toggle yap
    await toggleDay(habit.habit_id, noteModal.dateStr, noteModal.note.trim() || undefined);
    setNoteModal(null);
  };

  const handleDelete = async () => {
    if (!habit) return;
    await deleteHabit(habit.habit_id);
    router.push('/');
  };

  // Dairelerin pozisyonlarını hesapla - Her satırda tam 10 daire
  const circleSize = 56;
  const circleRadius = circleSize / 2;
  const itemsPerRow = 10; // Her satırda tam 10 daire
  
  const getCirclePosition = (index: number, total: number) => {
    const availableWidth = containerWidth;
    
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    // Daireler arası boşluk hesapla (container genişliğini tam kullan)
    const totalSpacing = availableWidth - (itemsPerRow * circleSize);
    const gap = itemsPerRow > 1 ? totalSpacing / (itemsPerRow - 1) : 0;
    
    // İlk dairenin merkez pozisyonu (sol kenardan circleRadius kadar içeride)
    const startX = circleRadius;
    const startY = circleRadius + 20; // Üstten 20px padding
    
    return {
      x: startX + col * (circleSize + gap),
      y: startY + row * (circleSize + 48), // Daire + dikey boşluk (32 * 1.5 = 48)
      itemsPerRow,
    };
  };

  const positions = useMemo(() => {
    return days.map((_, index) => getCirclePosition(index, days.length));
  }, [days.length, containerWidth]);

  // Daire elementinin gerçek DOM pozisyonunu al
  const getDayElementPos = (dayNumber: number) => {
    const element = document.getElementById(`day-${dayNumber}`);
    if (!element || !containerRef.current) {
      // Fallback: hesaplanan pozisyon
      const index = dayNumber - 1;
      if (index < 0 || index >= positions.length) return null;
      const position = positions[index];
      return { x: position.x, y: position.y };
    }
    
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Dairenin merkez noktası (container'a göre)
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  };

  // Bağlantı çizgilerini render et
  const renderChainLinks = () => {
    if (!habit) return [];
    
    const completedDays = days
      .map((day, index) => ({ ...day, index }))
      .filter(day => day.completed)
      .sort((a, b) => a.dayNumber - b.dayNumber);

    const linkGroups: React.ReactElement[] = [];

    for (let i = 0; i < completedDays.length - 1; i++) {
      const current = completedDays[i];
      const next = completedDays[i + 1];
      
      // Ardışık günler mi kontrol et
      if (next.dayNumber - current.dayNumber === 1) {
        const p1 = getDayElementPos(current.dayNumber);
        const p2 = getDayElementPos(next.dayNumber);

        if (p1 && p2) {
          // Satır atlaması kontrolü - Her satırda 10 daire
          const currentRow = Math.floor((current.dayNumber - 1) / itemsPerRow);
          const nextRow = Math.floor((next.dayNumber - 1) / itemsPerRow);
          const isRowJump = nextRow > currentRow;
          
          let dPath: string;
          if (isRowJump) {
            // Satır değişimi - eğri çizgi (10. günden 11. güne geçiş)
            // Daha eğimli eğri ki diğer günlerin üzerinden geçsin
            const rowHeight = p2.y - p1.y;
            const horizontalDistance = Math.abs(p2.x - p1.x);
            
            // Eğriyi daha yüksek yap (dairesel dairelerin üzerinden geçsin)
            // Kontrol noktaları daha yukarıda ve X ekseninde ortalanmış
            const curveHeight = rowHeight * 0.7; // Satırlar arası mesafenin %70'i kadar yukarı
            const curveOffsetX = horizontalDistance * 0.4; // X ekseninde daha fazla kaydır
            
            // İlk kontrol noktası: Sağdan yukarı doğru (daha eğimli)
            const cp1x = p1.x + curveOffsetX;
            const cp1y = p1.y - curveHeight;
            
            // İkinci kontrol noktası: Soldan aşağı doğru (daha eğimli)
            const cp2x = p2.x - curveOffsetX;
            const cp2y = p2.y + curveHeight;
            
            dPath = `M ${p1.x} ${p1.y} 
                     C ${cp1x} ${cp1y}, 
                       ${cp2x} ${cp2y}, 
                       ${p2.x} ${p2.y}`;
          } else {
            // Aynı satırda - düz çizgi
            dPath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
          }

          // Çizgi uzunluğunu hesapla (animasyon için)
          const pathLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          const dashLength = 30; // Işık parçası uzunluğu
          const gapLength = 15; // Boşluk uzunluğu
          
          linkGroups.push(
            <g key={`laser-group-${current.dayNumber}-${next.dayNumber}`} className="laser-container">
              {/* Ultra Wide Atmospheric Glow - Daha kalın */}
              <path
                d={dPath}
                fill="none"
                stroke={habit.color}
                strokeWidth="48"
                strokeLinecap="round"
                opacity="0.08"
                className="laser-glow-ultra-wide"
              />
              {/* Vibrant Mid Glow - Daha kalın */}
              <path
                d={dPath}
                fill="none"
                stroke={habit.color}
                strokeWidth="20"
                strokeLinecap="round"
                opacity="0.3"
                className="laser-glow-mid"
                style={{ color: habit.color }}
              />
              {/* Elektriksel Core - Kalın ve animasyonlu */}
              <path
                d={dPath}
                fill="none"
                stroke="#fff"
                strokeWidth="6"
                strokeLinecap="round"
                className="laser-core electric-pulse"
                style={{ 
                  strokeDasharray: `${dashLength} ${gapLength}`,
                  filter: `drop-shadow(0 0 20px ${habit.color}) drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))`
                }}
              />
              {/* İkinci elektriksel katman - Ters yönde */}
              <path
                d={dPath}
                fill="none"
                stroke={habit.color}
                strokeWidth="4"
                strokeLinecap="round"
                className="electric-pulse"
                style={{ 
                  strokeDasharray: `${dashLength} ${gapLength}`,
                  strokeDashoffset: dashLength + gapLength,
                  animationDelay: '0.75s',
                  opacity: 0.7
                }}
              />
            </g>
          );
        }
      }
    }
    return linkGroups;
  };

  if (!habit) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-slate-400 allura-regular">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <button
            onClick={() => router.push('/')}
            className="p-3 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all active:scale-75 backdrop-blur-sm"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic tracking-wider allura-regular" style={{ color: habit.color }}>
              {habit.title}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              {isFullyCompleted ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles size={18} className="text-yellow-400" style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }} />
                  </motion.div>
                  <motion.span
                    className="text-sm font-black uppercase tracking-wider allura-regular"
                    style={{ color: '#fbbf24' }}
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🎉 COMPLETED! 🎉
                  </motion.span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="animate-pulse" style={{ color: habit.color }} />
                  <span className="text-sm font-black text-slate-500 uppercase tracking-wider allura-regular">
                    Current Streak: <span style={{ color: habit.color }}>{streakData.current_streak} 🔥</span> / {habit.duration} days
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 hover:bg-red-900/30 rounded-xl text-red-400 hover:text-red-300 transition-all active:scale-75"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </motion.div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass-panel rounded-2xl p-6 border-red-500/20"
          >
            <p className="mb-4 text-center text-sm text-red-300 allura-regular">
              Are you sure you want to delete this habit?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white transition-all allura-regular"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl text-sm font-bold text-slate-200 transition-all allura-regular border border-white/18"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Daireler Container */}
        <div 
          ref={containerRef}
          className="glass-panel rounded-[3.5rem] p-10 relative overflow-hidden min-h-[400px]"
        >
          {/* Bitirilmiş Seri Parlama Efekti */}
          {isFullyCompleted && (
            <>
              {/* Arka plan parlama */}
              <motion.div
                className="absolute inset-0 rounded-[3.5rem] pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${habit.color}20 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Parlama halkaları */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`glow-ring-${i}`}
                  className="absolute inset-0 rounded-[3.5rem] pointer-events-none"
                  style={{
                    border: `2px solid ${habit.color}`,
                    opacity: 0.4,
                  }}
                  animate={{
                    scale: [1, 1.05 + i * 0.02, 1],
                    opacity: [0.4, 0.6 - i * 0.1, 0.4],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                />
              ))}
              {/* Başarı yıldızları efekti */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: habit.color,
                      boxShadow: `0 0 10px ${habit.color}, 0 0 20px ${habit.color}`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {/* SVG Bağlantı Çizgileri */}
          <svg 
            className="absolute top-0 left-0 pointer-events-none z-0 overflow-visible" 
            width="100%" 
            height="100%"
            style={{ 
              width: dimensions.width || '100%', 
              height: dimensions.height || '100%' 
            }}
          >
            {renderChainLinks()}
          </svg>

          {/* Partiküller */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-3 h-3 rounded-full pointer-events-none z-50"
              style={{
                backgroundColor: habit.color,
                boxShadow: `0 0 12px ${habit.color}, 0 0 24px ${habit.color}80`,
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
              animate={{
                x: Math.cos(particle.angle) * 80,
                y: Math.sin(particle.angle) * 80,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Daireler */}
          <div className="relative z-10">
            {days.map((day, index) => {
              const position = positions[index];
              const left = position.x - circleRadius;
              const top = position.y - circleRadius;
              
              return (
                <motion.div
                  key={day.dateStr}
                  id={`day-${day.dayNumber}`}
                  onClick={() => handleDayClick(day.dayNumber)}
                  className="day-node absolute flex flex-col items-center justify-center cursor-pointer group"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: index * 0.02,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  <motion.div 
                    className={`
                      node-base w-14 h-14 rounded-[1.6rem] flex items-center justify-center text-sm font-black z-20 transition-all duration-500 relative overflow-visible
                      ${day.completed ? 'text-white node-glow' : 'bg-white/5 backdrop-blur-md text-slate-400 border border-white/18 shadow-inner'}
                    `}
                    style={day.completed ? {
                      background: `linear-gradient(145deg, ${habit.color} 0%, ${habit.color}dd 100%)`,
                      boxShadow: isFullyCompleted 
                        ? `0 0 40px ${habit.color}, 0 0 60px ${habit.color}80, inset 0 4px 15px rgba(255, 255, 255, 0.5)`
                        : `0 0 25px ${habit.color}80, inset 0 4px 15px rgba(255, 255, 255, 0.5)`,
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      color: habit.color,
                    } : {}}
                    animate={
                      clickedDay === day.dayNumber && !day.completed
                        ? {
                            scale: [1, 1.3, 1.1, 1],
                            rotate: [0, 10, -10, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.6,
                      ease: 'easeOut',
                    }}
                  >
                    {/* Bitirilmiş seri için ekstra parlama - her dairede */}
                    {isFullyCompleted && day.completed && (
                      <motion.div
                        className="absolute inset-0 rounded-[1.6rem] pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${habit.color} 0%, transparent 70%)`,
                          filter: 'blur(15px)',
                          zIndex: -1,
                        }}
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* Ripple efekti */}
                    {clickedDay === day.dayNumber && !day.completed && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={`ripple-${i}`}
                            className="absolute inset-0 rounded-[1.6rem] border-2"
                            style={{
                              borderColor: habit.color,
                              opacity: 0.6,
                            }}
                            initial={{ scale: 0.8, opacity: 0.8 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.15,
                              ease: 'easeOut',
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* İçerik */}
                    {day.completed ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="relative"
                      >
                        <Zap size={22} className="fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                        {/* Not ikonu */}
                        {habit.logs.find(log => log.date === day.dateStr)?.note && (
                          <FileText 
                            size={10} 
                            className="absolute -top-1 -right-1 text-white drop-shadow-lg" 
                            style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <span className="tracking-tighter allura-regular">{day.dayNumber}</span>
                    )}

                    {/* Glow patlaması */}
                    {clickedDay === day.dayNumber && !day.completed && (
                      <motion.div
                        className="absolute inset-0 rounded-[1.6rem]"
                        style={{
                          background: `radial-gradient(circle, ${habit.color} 0%, transparent 70%)`,
                          filter: 'blur(10px)',
                          zIndex: -1,
                        }}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          ease: 'easeOut',
                        }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Streak Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 glass-panel rounded-2xl p-6 flex items-center justify-around"
        >
          <div className="text-center">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 allura-regular">Current Streak</p>
            <p className="text-3xl font-black allura-regular" style={{ color: habit.color }}>
              {streakData.current_streak} 🔥
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 allura-regular">Completed</p>
            <p className="text-3xl font-black text-white allura-regular">
              {days.filter(d => d.completed).length} / {habit.duration}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 allura-regular">Longest Streak</p>
            <p className="text-3xl font-black text-white allura-regular">
              {streakData.longest_streak} ⭐
            </p>
          </div>
        </motion.div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          onClick={() => setNoteModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-wider allura-regular">
                Day {noteModal.dayNumber} - {format(parseISO(noteModal.dateStr), 'MMM d, yyyy')}
              </h2>
              <button
                onClick={() => setNoteModal(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all backdrop-blur-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-400 allura-regular">
                Note (optional)
              </label>
              <textarea
                value={noteModal.note}
                onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                placeholder="Add a note about this day..."
                className="w-full rounded-xl border border-white/18 bg-white/5 backdrop-blur-md px-4 py-3 text-white placeholder:text-slate-400 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 allura-regular min-h-[120px] resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNoteModal(null)}
                className="flex-1 rounded-xl border border-white/18 bg-white/5 backdrop-blur-md px-6 py-3 font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white allura-regular"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={handleSaveNote}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-xl px-6 py-3 font-medium text-white transition-all shadow-lg hover:shadow-xl allura-regular"
                style={{ backgroundColor: habit.color }}
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
