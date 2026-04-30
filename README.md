# Habitter ⚪ Minimalist & Premium Habit Tracker

Welcome to your insanely polished, white-themed habit tracking dashboard. Habitter is engineered from the ground up as a premier full-stack application that focuses intensely on user experience, performance, and aesthetic perfection. 

### 🏗️ Technology Stack

*   **Frontend**: React 18 powered by Vite. Exceptionally rapid builds.
*   **Styling Engine**: Zero-dependency CSS. A highly custom Vanilla CSS design system specifically curated for white-themed sleek aesthetics, avoiding the bloated payload of larger CSS frameworks.
*   **Animations**: Built with `framer-motion` to construct liquid-smooth DOM transitions, hover effects, and staggering elements.
*   **Data Vis**: Integrating lightweight and beautiful representations via `recharts` for 7-day trailing data & custom CSS grid maps for the continuous 6-month tracker.
*   **Backend API**: Node.js & Express. Fast and robust REST endpoints. 
*   **Database**: SQLite embedded engine mapping all activities into a persistent footprint, allowing true historic insights.

---

### ✨ Features Developed

1.  **Liquid-Smooth DOM Operations** 
    All elements, from logging habits to modifying them, act instantaneously. Adding a new task animates sequentially into position with `AnimatePresence`. 
2.  **6-Month Historical Heatmap** 
    Your activity acts as a Github-style tracker giving you 180 solid days of data-visualization. The cells update dynamically between 4 discrete "levels" of heat based on your single-day throughput!
3.  **Real-Time Weekly Reporting** 
    Tick a task directly in the main view. Immediately, the internal state shifts the optimistic UI update, then silently updates your backend, subsequently shifting the weekly summary and bar-chart arrays.
4.  **"Decent" & "Pristine" Interfaces** 
    Every pixel matters. Smooth inner scaling across `<button>` interactions and standard elements ensure that there are no standard boring native form behaviors. `box-shadow` depth adds soft 3D elevations against a pure `#ffffff` flat background.

---

### 📂 File Architecture Overview

*   `server/`
    *   `server.js` - REST API & SQLite DB generation protocols.
*   `client/`
    *   `src/index.css` - CSS Design System, custom scrollbars, variable injection.
    *   `src/App.css` - Grid layouts and complex component rules.
    *   `src/App.jsx` - Core Stateful Engine parsing fetch results.

Your server spins on `http://localhost:3001/` and your client on `http://localhost:5173/`. 
All systems are currently running in the background. Open your browser and navigate to the client to begin!

Happy habit tracking!
