# ⚡ Focus Matrix

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Focus Matrix is a highly polished, interactive productivity web application designed to help you prioritize tasks using the **Eisenhower Matrix** method. Beautifully crafted with modern aesthetics, clean typography, smooth layout animations, and dark/light themes, it is the ultimate tool for visual task management.

---

## 📸 Screenshots

### 🖥️ Main Dashboard (Dark Mode)
![Focus Matrix Main Dashboard](./media/screenshot.png)

### 📊 Productivity Analytics & Activity Heatmap
![Focus Matrix Profile & Heatmap](./media/profile_screenshot.png)

---

## ✨ Features

- **🌀 The 4-Quadrant Matrix:** Classify your tasks into *Do First* (Urgent & Important), *Schedule* (Important, Not Urgent), *Delegate* (Urgent, Not Important), and *Eliminate* (Neither).
- **🎛️ Drag and Drop Sorting:** Drag tasks seamlessly between quadrants and the Inbox. Powered by `@dnd-kit` with layout animation feedback.
- **📥 Global Inbox:** Capture tasks immediately without interrupting your flow. A dedicated side-panel keeps raw ideas until you are ready to categorize them.
- **📈 Productivity Heatmap:** Track your progress over time with a GitHub-style 52-week activity heatmap. Clicking on any day reveals the exact list of tasks completed on that date.
- **⭐ Starred Tasks (Sub-Prioritization):** Pin your most critical task tickets to the top of each quadrant for immediate focus.
- **🧘 Zen Mode:** Maximize a single quadrant to focus exclusively on one category of tasks.
- **🗄️ Completed Task Archive:** Keep your board clean. Move completed tasks into a date-sorted archive with full restore capabilities.
- **🌓 Adaptive Dark Theme:** Automatic system-based theme matching with manual toggle, styled with smooth transitions.
- **📱 Fully Responsive Design:** Fluid layout adapting seamlessly to ultra-wide desktops, tablets, and mobile drawers.

---

## 🧠 Eisenhower Matrix Methodology

The matrix organizes tasks into four quadrants based on their **urgency** and **importance**:

| Urgent & Important | Not Urgent but Important |
| :--- | :--- |
| **Q1: Do First**<br>Tasks that require immediate attention and directly affect goals. | **Q2: Schedule**<br>Tasks that help achieve goals but can be planned for later. |
| **Q3: Delegate**<br>Tasks that must be done soon but can be assigned to others. | **Q4: Eliminate**<br>Distractions or low-value tasks that should be avoided. |
| **Urgent & Not Important** | **Not Urgent & Not Important** |

---

## 🛠️ Tech Stack

- **Core:** React 19, TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4, Lucide React (Icons)
- **Drag-and-Drop:** `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- **Animations:** `motion/react` (Framer Motion)
- **Tooltips:** Radix UI Tooltip primitives
- **Routing:** React Router Dom v7

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js (v18+) and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/eisenhower-matrix.git
   cd eisenhower-matrix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000` to start prioritizing!

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
eisenhower-matrix/
├── docs/                 # Detailed architectural guides
│   ├── matrix.md         # Matrix component & drag-and-drop state
│   ├── profile.md        # Profile state & activity heatmap
│   ├── sidebar.md        # Inbox drawer & archive drawer logic
│   └── style.md          # Colors, design system guidelines, typography
├── media/                # Screenshots and project assets
│   ├── screenshot.png
│   └── profile_screenshot.png
├── src/
│   ├── components/       # Reusable components (TaskTicket, Quadrant, etc.)
│   ├── pages/            # Page layouts (ProfilePage)
│   ├── lib/              # Utility helpers
│   ├── types.ts          # TypeScript type definitions
│   ├── App.tsx           # Application layout, state & routing
│   └── main.tsx          # Application entry point
├── index.html
├── package.json
└── vite.config.ts
```

For a deeper dive into code implementation details, please review our [Agent & Developer Guide](AGENTS.md) and the respective files in the `docs/` folder.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
