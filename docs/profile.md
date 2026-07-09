# Profile Page

**Route**: `/profile`
**Component**: `src/pages/ProfilePage.tsx`

The Profile page is a dedicated route that displays the user's information and a GitHub-style activity heatmap tracking their productivity.

## User Profile
- **State**: The user's profile consists of `name` and `title`.
- **Persistence**: Stored in `localStorage` under the key `focus-matrix-profile`.
- **Avatars**: The application uses a static person icon from `lucide-react`.
- **Editing**: Users can edit their Name and Title directly on the page. The state is elevated to `App.tsx` and passed down via props (`profile`, `onUpdateProfile`).

## Activity Heatmap
- **Data Source**: Calculates task completions by iterating over the `tasks` array (passed down from `App.tsx`). It looks for tasks with `completed: true` and uses their `completedAt` timestamp to aggregate daily counts.
- **Visualization**:
  - Displays a grid of squares, representing 52 weeks of activity.
  - Cell colors correspond to the volume of tasks completed on that day (e.g., using Tailwind `emerald` classes from `bg-slate-100` / `dark:bg-slate-800` up to `bg-emerald-500`).
- **Interaction**:
  - **Tooltips**: Hovering over a heatmap cell displays a customized tooltip showing the exact number of tasks completed and the date. This uses `@radix-ui/react-tooltip`.
  - **Daily Task List**: Clicking on a cell selects that date and reveals a list of all tasks completed on that day below the heatmap, complete with slide-down animations.

## Responsiveness
- The layout adjusts from a vertical stack on smaller screens to a more horizontal, spacious layout on large screens.
- Total task count and editing actions relocate appropriately depending on screen size.
