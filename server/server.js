const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.sqlite');

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed BOOLEAN NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    )
  `);
  
  // Create an index for faster queries on logs
  db.run(`CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id)`);
});

// GET all habits with their logs for a date range
app.get('/api/habits', (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate required' });
  }

  db.all(`SELECT * FROM habits ORDER BY created_at ASC`, (err, habits) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Get logs for the date range
    db.all(
      `SELECT * FROM habit_logs WHERE date >= ? AND date <= ?`,
      [startDate, endDate],
      (err, logs) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Group logs by habit_id
        const logsByHabit = logs.reduce((acc, log) => {
          if (!acc[log.habit_id]) acc[log.habit_id] = {};
          acc[log.habit_id][log.date] = log.completed;
          return acc;
        }, {});

        const result = habits.map(habit => ({
          ...habit,
          logs: logsByHabit[habit.id] || {}
        }));
        
        res.json(result);
      }
    );
  });
});

// POST new habit
app.post('/api/habits', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  
  const id = uuidv4();
  const created_at = new Date().toISOString();
  
  db.run(
    `INSERT INTO habits (id, title, created_at) VALUES (?, ?, ?)`,
    [id, title, created_at],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, title, created_at, logs: {} });
    }
  );
});

// DELETE a habit
app.delete('/api/habits/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM habits WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// POST toggle habit log
app.post('/api/habits/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  
  if (!date) return res.status(400).json({ error: 'Date is required' });
  
  // Check current status
  db.get(
    `SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?`,
    [id, date],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const logId = uuidv4();
      
      if (row) {
        // Toggle the existing
        const newStatus = !row.completed;
        db.run(
          `UPDATE habit_logs SET completed = ? WHERE habit_id = ? AND date = ?`,
          [newStatus, id, date],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ completed: newStatus });
          }
        );
      } else {
        // Insert new entry as true
        db.run(
          `INSERT INTO habit_logs (id, habit_id, date, completed) VALUES (?, ?, ?, ?)`,
          [logId, id, date, true],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ completed: true });
          }
        );
      }
    }
  );
});

// GET stats summary
app.get('/api/stats', (req, res) => {
   // Calculate overall completion data, steaks, etc.
   // Given SQLite features, returning raw data grouped by date is simpler, frontend handles stats.
   // Fetch last 180 days logs
   const sixMonthsAgo = new Date();
   sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
   const startDate = sixMonthsAgo.toISOString().split('T')[0];

   db.all(
     `SELECT date, habit_id, completed FROM habit_logs WHERE date >= ? AND completed = 1`,
     [startDate],
     (err, logs) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json(logs);
     }
   );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
