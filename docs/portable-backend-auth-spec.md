# Specification: Portable Multi-Target Backend & Authentication (Zero Lock-In)

**Status:** `ready-for-agent`  
**Domain Area:** Core Backend, Persistence & Authentication  
**Deploy Targets:** Cloudflare Workers (D1) / VPS (Node/Bun + Local SQLite)

---

## Problem Statement

Currently, Focus Matrix is a purely client-side React application that stores all tasks, profile settings, and UI preferences in the browser's `localStorage`. Because of this:
1. User data is strictly trapped inside a single browser and device; users cannot access their task matrix across multiple devices (mobile, laptop, work machine).
2. Clearing browser cache or switching browsers leads to irreversible data loss.
3. The user wants cloud synchronization and user accounts, but explicitly requires **zero vendor lock-in**: the project must be capable of deploying to Cloudflare Workers with Cloudflare D1, or running both frontend and backend on a self-hosted VPS (Docker / Node.js / Bun) using local SQLite files without modifying application business logic.

---

## Solution

Build a lightweight, portable backend service using **Hono** and **Drizzle ORM** targeting SQLite.
- Provide a unified SQLite schema for `users`, `sessions`, `tasks`, and `profile`.
- Implement an environment-aware database abstraction adapter that automatically binds to Cloudflare D1 when deployed on Cloudflare Workers, or falls back to standard local SQLite (`better-sqlite3` or `bun:sqlite`) when deployed on a VPS.
- Implement an authentication system supporting email/password registration, login, and secure HTTP-only session cookies without third-party vendor dependencies.
- Expose RESTful API endpoints for tasks (CRUD, quadrant movement, inbox, archive, starring) and profile data, replacing/augmenting the frontend's local storage layer with server synchronization.

---

## User Stories

### Authentication & Account Management
1. As a new user, I want to sign up with my email, password, and name, so that I can create a secure account.
2. As a registered user, I want to log in with my email and password, so that I can access my stored tasks and profile.
3. As an authenticated user, I want my session to persist across page reloads via secure HTTP-only cookies, so that I do not have to log in repeatedly.
4. As a user, I want to log out of my account, so that other users on the same machine cannot access my matrix.
5. As an unauthenticated visitor, I want clear feedback if I attempt to access protected endpoints, so that I understand why an action failed.
6. As a user, I want my password to be hashed securely before storage, so that my credentials cannot be recovered in plaintext.
7. As a user attempting to sign up with an existing email, I want an immediate error message informing me that the email is already registered.

### Task Management & Sync
8. As a user, I want all my created tasks to sync to the backend SQLite database, so that my tasks are securely stored in the cloud.
9. As a user, I want to retrieve all my active tasks categorized by quadrant (`q1`, `q2`, `q3`, `q4`, `inbox`) when I open the app, so that my matrix is up-to-date.
10. As a user, I want to drag and drop a task into a different quadrant and have the change saved on the server, so that my matrix state is preserved.
11. As a user, I want to mark a task as completed or reopen it, with the status updated on the server, so that my progress is recorded accurately.
12. As a user, I want to star or unstar high-priority tasks with immediate server persistence, so that key tasks remain highlighted.
13. As a user, I want to move tasks to the archive or delete them permanently, so that my matrix stays organized.
14. As a user, I want each task to record its creation timestamp and closed timestamp on the server, so that my task history and profile heatmap reflect accurate data.
15. As a multi-tenant user, I want my tasks to be isolated from other users' tasks, so that my personal matrix is private.

### Profile & Settings Sync
16. As a user, I want to update my profile display name and title, so that my profile page reflects my identity.
17. As a user, I want my profile metadata and activity history to load from the server, so that my heatmap works consistently across all devices.
18. As an offline user or guest, I want the option for the frontend to fall back to `localStorage` when no backend is configured, so that the app remains functional as a standalone tool.

### Portability & Deployment
19. As a developer/self-hoster, I want to run the full stack on a VPS using Docker or Node/Bun with a local `sqlite.db` file, so that I am not dependent on any cloud platform.
20. As a developer, I want to deploy the same backend codebase to Cloudflare Workers with Cloudflare D1 without editing route handlers, so that I can leverage serverless edge hosting.
21. As a developer, I want database migrations to execute cleanly on both Cloudflare D1 and local SQLite, so that schema updates are repeatable and safe.

---

## Implementation Decisions

### Architectural Framework & Database Layer
- **API Framework:** **Hono** (`hono`), chosen for its pure Web Standards compliance (`Request`, `Response`, `fetch`), ultra-low memory footprint, and native execution across Cloudflare Workers, Node.js, Bun, and Deno.
- **ORM & Database Driver:** **Drizzle ORM** (`drizzle-orm`) with `drizzle-orm/sqlite-core`.
  - On Cloudflare: instantiated via `drizzle(env.DB)`.
  - On VPS / Node / Bun: instantiated via `drizzle(sqliteDb)` using `better-sqlite3` or native SQLite.
- **Unified Schema Design:** Defined in a shared schema module:
  - `users`: `id` (text PK), `email` (text unique), `passwordHash` (text), `name` (text), `createdAt` (integer).
  - `sessions`: `id` (text PK), `userId` (text FK to users.id), `expiresAt` (integer).
  - `tasks`: `id` (text PK), `userId` (text FK to users.id), `title` (text), `description` (text nullable), `quadrantId` (text: 'q1'|'q2'|'q3'|'q4'|'inbox'), `completed` (integer/boolean), `starred` (integer/boolean), `position` (integer), `createdAt` (integer), `closedAt` (integer nullable).
  - `profiles`: `userId` (text PK FK to users.id), `name` (text), `title` (text), `updatedAt` (integer).

### Authentication Protocol
- **Session Management:** Cryptographically random session tokens stored in the `sessions` table and set via secure HTTP-only cookies (`SameSite=Lax`, `HttpOnly`, `Path=/`, `Secure` in production).
- **Password Hashing:** Standard Web Crypto PBKDF2 / Argon2 / Scrypt portable hashing functions compatible with edge runtimes and Node.js without native C-binding dependencies.

### Frontend Integration Strategy
- Create an API client layer in `src/lib/api.ts` providing typed functions for auth, task mutations, and profile fetching.
- Add an auth context and login/signup modal/route while preserving the existing Matrix UI, DnD mechanics, and Tailwind aesthetic per `docs/style.md` and `docs/matrix.md`.

---

## Testing Decisions

### Test Quality Philosophy
- Tests must strictly test **observable external behavior** (HTTP status codes, response payloads, database state after operations) rather than private implementation details.
- Avoid mocking internal queries; test against a real, ephemeral in-memory SQLite database instance.

### Primary Testing Seam (Highest Practical Seam)
- **HTTP Dispatch Seam (`app.request`)**:
  - The primary testing seam is the Hono Application dispatcher (`app.request('/api/...')`).
  - By passing standard `Request` objects directly into the Hono application initialized with an in-memory SQLite database (`:memory:`), the complete request lifecycle—including middleware, authentication cookie parsing, route handlers, Drizzle ORM queries, and response serialization—is tested in a single fast, deterministic suite without needing live network ports or external servers.

### Frontend Testing Seam
- Custom Hook / API Client seam (`useTasks`, `useAuth`) mocking HTTP fetch responses to verify UI state transitions, optimistic updates, and drag-and-drop sync.

---

## Out of Scope
- Real-time multi-user collaborative editing (e.g. CRDTs or shared multiplayer cursors).
- Social OAuth providers (Google, GitHub, Apple) in the initial portable release (can be added as an extension layer via standard OAuth 2.0).
- Complex payment/billing tiers.
- Email verification / password reset emails (in this first iteration, self-contained email/password signup and login are supported).

---

## Further Notes
- The database schema is fully forward-compatible with Cloudflare D1 migrations (`wrangler d1 migrations apply`) and standard Drizzle Kit CLI migrations (`drizzle-kit migrate`).
- The frontend preserves offline fallback capability if the user elects to run in guest / local-only mode.
