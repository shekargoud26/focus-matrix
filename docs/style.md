# Style & Aesthetics

This project adheres to a highly polished, clean, and modern design system. Do not use generic or default HTML styling. Every element should feel deliberate and consistent with the rules below.

## Core Framework
- **CSS Framework**: Tailwind CSS (Utility classes only).
- **Icons**: `lucide-react` only. Do not introduce custom SVGs or other icon libraries.
- **Animations**: `motion/react` for complex layout transitions; Tailwind's `transition-all duration-300` for simple hover states.

## Color Palette
The app uses a strict color palette centered around Tailwind's `slate` colors for structure, and `blue`/`emerald` for accents.

### Light Mode
- **Backgrounds**: `bg-slate-50` (app background), `bg-white` (cards, drawers).
- **Text**: `text-slate-900` (headings, primary text), `text-slate-500` (secondary text, muted icons).
- **Borders**: `border-slate-200`.

### Dark Mode
- **Backgrounds**: `dark:bg-slate-950` (app background), `dark:bg-slate-900` (cards, drawers, inputs).
- **Text**: `dark:text-white` (headings, primary text), `dark:text-slate-400` (secondary text, muted icons).
- **Borders**: `dark:border-slate-800`.

### Accents
- **Primary Actions (Buttons, Links)**: `bg-blue-600 hover:bg-blue-700 text-white`.
- **Destructive Actions**: `text-red-500 hover:bg-red-50`.
- **Success/Heatmap**: `emerald` palette (`emerald-200` through `emerald-600`).
- **Focus Rings**: Always include accessible focus rings on interactive elements: `focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50`.

## Typography
- **Font**: Inter (sans-serif), typically inherited via Tailwind's default sans stack.
- **Headings**: Use strong font weights and tight tracking (`font-bold tracking-tight`).
- **Data/Meta**: Small, medium-weight text (`text-sm font-medium`).

## Layout & Structure
- **Radii**: Use generous border radii for containers (`rounded-xl`, `rounded-2xl`). Buttons and inputs should use `rounded-md` or `rounded-lg`.
- **Shadows**: Use subtle shadows for depth (`shadow-sm` on cards, `shadow-md` or `shadow-xl` for popovers/tooltips).
- **Spacing**: Use consistent, rhythmic spacing. Avoid cramped layouts. Lean on `gap-4`, `gap-6`, `p-6` for component internals.

## Component Specifics
- **Inputs**: Clean borders, light background, clear placeholder text, and strong focus states.
  - Example: `bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/50`
- **Tooltips**: Use `@radix-ui/react-tooltip`. They should have dark backgrounds in light mode, and light backgrounds in dark mode for maximum contrast. No default browser tooltips (`title="..."`) for complex UI.
