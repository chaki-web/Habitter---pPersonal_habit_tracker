import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Target 
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

  return (
    <div className="app-layout">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="quote-text"
            >
              "{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="dashboard-grid">
          
          {/* Main Habits Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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
                placeholder="What new habit do you want to start?"
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
              <div className="habit-list">
                <AnimatePresence>
                  {habits.map((habit, index) => (
                    <motion.div 
                      key={habit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
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
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              key={dateStr}
                              className={`day-box ${isCompleted ? 'completed' : ''}`}
                              onClick={() => toggleHabit(habit.id, date)}
                              style={isToday ? { borderBottom: '2px solid var(--accent-color)' } : {}}
                              title={format(date, 'MMM d, yyyy')}
                            >
                              {isCompleted ? <Check size={16} /> : format(date, 'E')[0]}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Sidebar / Stats Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
            <div className="heatmap">
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
                    className="heatmap-cell" 
                    data-level={level}
                    title={`${d}: ${count} habits completed`}
                    whileHover={{ scale: 1.5 }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
