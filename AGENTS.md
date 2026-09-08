# Focus Matrix Documentation

Welcome to the Focus Matrix project! This file serves as the entry point and core context guide for any AI agent or developer working on this codebase.

## Documentation Index

When asked to modify or add features, **please refer to the following documentation files** to ensure you maintain the existing architecture, data structures, and styling guidelines:

- **[Style & Aesthetics (`docs/style.md`)](docs/style.md)**: Read this before creating new components or modifying the UI. It outlines the specific Tailwind CSS utilities, color palettes, and animation libraries used to achieve the application's clean, modern, and cohesive look.
- **[Eisenhower Matrix (`docs/matrix.md`)](docs/matrix.md)**: Read this if you are modifying the core task board, drag-and-drop functionality, or task data structures.
- **[Profile & Heatmap (`docs/profile.md`)](docs/profile.md)**: Read this for context on the user profile page, activity heatmap, and profile state persistence.
- **[Sidebars & Drawers (`docs/sidebar.md`)](docs/sidebar.md)**: Read this when working with the Inbox, Archive, or any mobile-responsive slide-out drawers.

- **[Deploy Targets (`docs/deploy.md`)](docs/deploy.md)**: Read this when touching the backend, database, or deployment. Same Hono handlers run on Cloudflare Workers (D1) and VPS (local SQLite).
- **[Backend Spec (`docs/portable-backend-auth-spec.md`)](docs/portable-backend-auth-spec.md)**: The portable-backend source of truth (schema, auth, API contract, testing seams).

## Core Architecture

- **Framework**: React 18+ with Vite and TypeScript.
- **Routing**: `react-router-dom` (Currently configured with `/` for the Matrix and `/profile` for the User Profile).
- **Backend**: Hono (`server/app.ts` via `createApp(db)`) + Drizzle ORM (SQLite). Dual entries: `server/index.workers.ts` (Cloudflare D1 via `server/db/d1.ts`) and `server/index.node.ts` (VPS local SQLite via `server/db/local.ts`, also serves `./dist`). Route handlers are driver-agnostic — never import `env.DB`, `better-sqlite3`, or `node:*` outside `server/db/local.ts` / `server/db/migrate.ts` / `server/test-utils.ts` (`:memory:` test seam only).
- **Persistence**: Server SQLite (`users`, `sessions`, `tasks`, `profiles` — see `server/db/schema.ts`) when authed; client-side `localStorage` (`eisenhower-tasks`, `focus-matrix-profile`, `focus-matrix-theme`) as guest fallback / cache.
- **Drag and Drop**: `@dnd-kit/core` and related packages for the matrix drag-and-drop experience.
- **Animations**: `motion/react` for layout animations, component mounting/unmounting, and transitions.

## Golden Rules for Agents

1. **Check `docs/style.md` first**: The app has a very specific, polished aesthetic using Tailwind CSS. Do not use generic styling; stick strictly to the established design system.
2. **Preserve Responsive Design**: Always account for both desktop layouts (often using CSS Grid/Flexbox) and mobile layouts (often using sliding drawers).
3. **No Unsolicited Scope**: Implement exactly what the user asks for. Do not add backend databases or complex state management libraries (like Redux) unless explicitly requested. The current app is a lightweight, client-side application.
4. **Use Existing Icons**: All icons must come from `lucide-react`.
