import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { 
  format, 
  eachDayOfInterval, 
  subDays, 
  addDays,
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  subMonths 
} from 'date-fns';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Check, 
  TrendingUp, 
  BarChart3, 
  Target,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import './App.css';

const API_URL = 'http://localhost:3001/api';

const MOTIVATIONAL_QUOTES = [
  "Small daily improvements are the key to staggering long-term results.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Success is the product of daily habits—not once-in-a-lifetime transformations.",
  "Every action you take is a vote for the type of person you wish to become.",
  "Discipline is choosing between what you want now and what you want most.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Don't break the chain. Keep the momentum going.",
  "The secret to getting ahead is getting started.",
  "Your future is created by what you do today, not tomorrow."
];

function App() {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const [isHovering, setIsHovering] = useState(false);
  const [particles, setParticles] = useState([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // -- Custom Cursor Logic --
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 90);
      cursorY.set(e.clientY - 90);
      dotX.set(e.clientX - 4);
      dotY.set(e.clientY - 4);
    };
    
    const handleMouseOver = (e) => {
      // Includes text elements as interactive so the bubble magnifies over them
      const isInteractive = e.target.closest('button, a, input, .day-box, .heatmap-cell, p, span, h1, h2, h3, h4, h5, h6, .logo, .quote-text, label, .habit-name, .section-title, .stat-value, .stat-label');
      setIsHovering(!!isInteractive);
    };

    const handleMouseClick = (e) => {
      const newParticles = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i + Math.random(),
        x: e.clientX,
        y: e.clientY,
        angle: (i * 360) / 6 + (Math.random() * 20 - 10)
      }));
      setParticles(prev => [...prev, ...newParticles]);
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 600);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('click', handleMouseClick);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleMouseClick);
    };
  }, [cursorX, cursorY, dotX, dotY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Get last 7 days for the main tracking view
  const today = new Date();
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today
  });

  const fetchHabits = async () => {
    try {
      // Fetch for a slightly larger range just to have local state ready
      const startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
      const endDate = format(today, 'yyyy-MM-dd');
      
      const res = await fetch(`${API_URL}/habits?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchHabits(), fetchStats()]).then(() => setLoading(false));
  }, []);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;

    try {
      const res = await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newHabit.trim() })
      });
      const habit = await res.json();
      setHabits([...habits, habit]);
      setNewHabit('');
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleDeleteHabit = async (id) => {
    try {
      await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' });
      setHabits(habits.filter(h => h.id !== id));
      fetchStats();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const toggleHabit = async (habitId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Optimistic update
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newLogs = { ...habit.logs };
        newLogs[dateStr] = !newLogs[dateStr];
        return { ...habit, logs: newLogs };
      }
      return habit;
    }));

    try {
      await fetch(`${API_URL}/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr })
      });
      fetchStats();
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revert on error
      fetchHabits();
    }
  };

  // Calculate stats
  const totalCompletions = stats.length;
  
  // Weekly completion
  const thisWeekStart = format(startOfWeek(today), 'yyyy-MM-dd');
  const thisWeekStats = stats.filter(s => s.date >= thisWeekStart);
  
  // Chart Data preparation (Last 7 days completion count)
  const chartData = last7Days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = stats.filter(s => s.date === dateStr).length;
    return {
      name: format(date, 'EEE'),
      completed: count
    };
  });

  const innerX = useTransform(cursorXSpring, x => -x);
  const innerY = useTransform(cursorYSpring, y => -y);
  const originX = useTransform(cursorXSpring, x => x + 90);
  const originY = useTransform(cursorYSpring, y => y + 90);
  const transformOrigin = useMotionTemplate`${originX}px ${originY}px`;

  const appContent = (
    <>

      <header className="header">
        <div className="logo text-gradient">
          <Activity size={28} color="#000" />
          Habitter
        </div>
        <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
          {format(today, 'EEEE, MMMM do')}
        </div>
      </header>

      <main className="main-content">
        {/* Quotes Carousel */}
        <div className="quotes-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="quote-text"
            >
              "{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="dashboard-grid">
          
          {/* Main Habits Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <div className="section-title">
              Your Habits
              <span style={{fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)'}}>
                Last 7 Days
              </span>
            </div>

            <form onSubmit={handleAddHabit} style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
              <input
                type="text"
                className="add-habit-input"
                style={{marginBottom: 0}}
                placeholder="What new habit will you start today?"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Plus size={20} /> Add
              </button>
            </form>

            {loading ? (
              <div className="empty-state">Loading your habits...</div>
            ) : habits.length === 0 ? (
              <div className="card empty-state">
                <Target size={48} />
                <h3>No habits yet</h3>
                <p>Start tracking your first habit to see your progress.</p>
              </div>
            ) : (
              <motion.div layout className="habit-list">
                <AnimatePresence>
                  {habits.map((habit, index) => (
                    <motion.div 
                      layout
                      key={habit.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 25, 
                        delay: index * 0.05 
                      }}
                      className="habit-card"
                    >
                      <div className="habit-info">
                        <button 
                          onClick={() => handleDeleteHabit(habit.id)}
                          style={{color: '#ef4444', opacity: 0.5}}
                          className="hover-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="habit-name">{habit.title}</span>
                      </div>

                      <div className="days-row">
                        {last7Days.map((date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const isCompleted = habit.logs[dateStr];
                          const isToday = isSameDay(date, today);
                          
                          return (
                            <motion.div
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              key={dateStr}
                              className={`day-box ${isCompleted ? 'completed' : ''}`}
                              onClick={() => toggleHabit(habit.id, date)}
                              style={isToday ? { borderBottom: '2px solid var(--accent-color)' } : {}}
                              title={format(date, 'MMM d, yyyy')}
                            >
                              {isCompleted ? <motion.div initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 300}}><Check size={16} /></motion.div> : format(date, 'E')[0]}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar / Stats Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
            style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}
          >
            <div className="card stats-card">
              <div className="section-title" style={{marginBottom: '0.5rem'}}>
                <TrendingUp size={20} />
                Weekly Report
              </div>
              <div className="stat-row">
                <span className="stat-label">Completions this week</span>
                <span className="stat-value">{thisWeekStats.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total All-Time</span>
                <span className="stat-value">{totalCompletions}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Active Habits</span>
                <span className="stat-value">{habits.length}</span>
              </div>
            </div>

            <div className="card">
              <div className="section-title">
                <BarChart3 size={20} />
                 Trends (Last 7 Days)
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#737373'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#737373'}} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#fcfcfc'}} contentStyle={{borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}} />
                    <Bar dataKey="completed" fill="#000000" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </motion.div>

        </div>

        {/* 6 Months Heatmap spans full width at the bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
          className="card" 
          style={{marginTop: '2rem'}}
        >
          <div className="section-title">
            6 Months Tracker
          </div>
          <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem'}}>
            Showing tracking consistency for the last 6 months (182 days). Color intensity mimics Github commit patterns.
          </p>
          <div className="heatmap-container">
            <motion.div 
              className="heatmap"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.003
                  }
                }
              }}
            >
              {Array.from({ length: 182 }).map((_, i) => {
                // To flow top-to-bottom, left-to-right, index 181 is today
                const d = format(subDays(today, 181 - i), 'yyyy-MM-dd');
                const count = stats.filter(s => s.date === d).length;
                let level = 0;
                if(count === 1) level = 1;
                else if(count === 2) level = 2;
                else if(count === 3) level = 3;
                else if(count >= 4) level = 4;

                return (
                  <motion.div 
                    key={i} 
                    variants={{
                      hidden: { opacity: 0, scale: 0.2 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                    className="heatmap-cell" 
                    data-level={level}
                    title={`${d}: ${count} habits completed`}
                    whileHover={{ scale: 1.4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </main>
    </>
  );

  return (
    <div className="app-layout">
      {/* Scroll context for duplicate app */}
      <div style={{ visibility: 'visible' }}>
        {appContent}
      </div>

      {/* REAL MAGNIFIER GLASS */}
      <motion.div
        className="magnifier-ring"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 180,
          height: 180,
          borderRadius: '50%',
          overflow: 'hidden',
          pointerEvents: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2), inset 0 0 15px rgba(0,0,0,0.1)',
          border: '2px solid rgba(255,255,255,0.7)',
          translateX: cursorXSpring,
          translateY: cursorYSpring,
          background: 'var(--bg-color)',
          zIndex: 9998
        }}
        animate={{
          scale: isHovering ? 1 : 0.3, // grows huge on hover
          opacity: 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.div
           style={{
             position: 'absolute',
             top: 0,
             left: 0,
             width: '100vw',
             height: '100vh',
             x: innerX,
             y: innerY,
             scale: 1.5, // The MAGNIFICATION Power
             transformOrigin: transformOrigin,
             pointerEvents: 'none'
           }}
        >
          {/* Apply scroll offset so duplicate matches viewport perfectly */}
          <div className="app-layout" style={{ position: 'relative', top: -scrollY, minHeight: '100vh' }}>
            {appContent}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="cursor-dot"
        style={{
          translateX: dotX,
          translateY: dotY,
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Click Thunder Splash Effects */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, scale: 0, opacity: 1, rotate: p.angle }}
            animate={{ 
              x: p.x + Math.cos(p.angle * Math.PI / 180) * 100, 
              y: p.y + Math.sin(p.angle * Math.PI / 180) * 100,
              scale: [0, 1.2, 0],
              opacity: [1, 1, 0],
              rotate: p.angle + 45
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: 'fixed',
              left: -12,
              top: -12,
              pointerEvents: 'none',
              zIndex: 10001,
              color: '#facc15'
            }}
          >
            <Zap size={24} fill="#facc15" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default App;
