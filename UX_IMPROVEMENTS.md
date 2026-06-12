# Focus Matrix - UX/UI Improvements & Feature Roadmap

This document contains recommendations from a Senior Product Designer for improving the Focus Matrix application. It is structured as an actionable checklist so that AI agents or human developers can iteratively implement, test, and mark features as completed.

**Instructions for AI Agents:**
1. Read this document to find uncompleted tasks (marked with `[ ]`).
2. Implement the feature in the codebase.
3. Test the application.
4. Update this document to mark the task as completed (`[x]`).

---

## 1. The UX Tear-Down (Friction Points)

*Friction points represent cognitive overload, confusing navigation, or moments where users might struggle.*

- [x] **Implement Task Editing**
  - **Friction:** Currently, users cannot modify a task once it is created. If there's a typo, they must delete and recreate it. This violates usability heuristics of user control and freedom.
  - **Action:** Add an edit button inside the task card's hover state menu, or allow double-clicking the text to enter an inline edit mode.

- [x] **Improve Empty State Guidance**
  - **Friction:** When a quadrant is empty, it relies heavily on the user knowing what constraints apply.
  - **Action:** Add subtle, actionable empty-state text inside each quadrant (e.g., inside 'Schedule': "Add tasks that require planning but aren't urgent").

- [ ] **Undo Action for Destructive Operations**
  - **Friction:** Clicking the delete or complete button immediately removes the task. Accidental clicks happen, leading to frustration.
  - **Action:** Implement a toast notification (e.g., "Task archived") with a quick "Undo" button that lasts for 5 seconds.

---

## 2. High-Value Feature Recommendations

*These are "low-hanging fruit" features that offer high value to the user with reasonable development effort.*

- [x] **Feature: Sub-Prioritization (Starred Tasks)**
  - **The User Problem It Solves:** Within the "Do First" quadrant, users might have 5 tasks. Which one is *the most* important?
  - **The Impact:** Gives users micro-control over their immediate focus, improving task execution and reducing decision fatigue.
  - **Action:** Add a small star/flag icon to task cards that pins them to the top of their respective quadrant.

- [ ] **Feature: Due Dates / Time Context**
  - **The User Problem It Solves:** The "Schedule" quadrant implies time, but there is no mechanism to actually attach a date/time to the task. 
  - **The Impact:** Turns an abstract bucket into an actionable timeline tool, making the app much stickier for daily usage.
  - **Action:** Add an optional date picker when adding/editing a task, and display the date subtly on the task card.

- [ ] **Feature: Clear All / Bulk Actions in Quadrant**
  - **The User Problem It Solves:** At the end of the day or week, users might want to clear out the "Don't Do" or "Delegate" quadrants entirely.
  - **The Impact:** Reduces manual repetitive clicking, making the transition between planning sessions seamless.
  - **Action:** Add an ellipsis or "Clear All" button in the header of each quadrant (perhaps hidden under a small dropdown menu to prevent accidental clicks).

- [ ] **Feature: Global Inbox (Sidebar Integrable)**
  - **The User Problem It Solves:** Users need a place to quickly capture tasks without having to decide immediately which matrix (Work, Personal) or quadrant they belong to.
  - **The Impact:** Reduces cognitive friction during task capture. It will serve as a foundational piece for the upcoming left sidebar multi-matrix architecture.
  - **Action:** 
    - *Phase 1 (Current view):* Create an unbound "Inbox" container (e.g., a slide-over panel or expandable tray) for rapidly capturing unassigned tasks. Introduce drag-and-drop from the Inbox into the main quadrants.
    - *Phase 2 (With Sidebar):* Move the Inbox to the top of the new left sidebar, acting as the universal capture zone across all custom matrices.

---

## 3. Visual & Hierarchy Adjustments

*Tactical feedback on layout, typography, contrast, and information architecture.*

- [x] **Task Count Metrics**
  - **Improvement:** Add a small task counter badge next to the quadrant title (e.g., "Do First (3)"). This provides instant situational awareness of workload distribution.

- [ ] **Enhance Drag & Drop Affordance**
  - **Improvement:** While the cursor changes, the visual connection during drag and drop can be improved. Introduce a placeholder block (a dashed outline) in the destination quadrant to clearly show where the task will land.

- [x] **Refine the Task Input Form Alignment**
  - **Improvement:** Ensure the Add Task popover's input fields support seamless keyboard navigation (Focus trapping, Tab indexing). Ensure the styling of the inputs precisely matches the design language of the cards.

- [x] **Visual Distinction of Quadrants**
  - **Improvement:** While quadrants have subtle background colors, the titles could use a stronger visual anchor. Consider adding a small accompanying icon next to each quadrant title (e.g., Zap for Do First, Calendar for Schedule, Users for Delegate, X-Circle for Eliminate) to strengthen visual scanning.
