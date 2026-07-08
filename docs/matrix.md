# Eisenhower Matrix

**Component**: `src/App.tsx` (Main Layout), `src/components/Quadrant.tsx`, `src/components/TaskTicket.tsx`
**Route**: `/`

The core feature of the application is the Eisenhower Matrix, a 2x2 grid that helps users prioritize tasks by urgency and importance.

## Quadrants
The matrix consists of four specific quadrants (defined in `src/types.ts`):
1. **q1 (Do First)**: Urgent & Important
2. **q2 (Schedule)**: Not Urgent & Important
3. **q3 (Delegate)**: Urgent & Not Important
4. **q4 (Don't Do)**: Not Urgent & Not Important

## Task Data Structure
Tasks are defined by the `Task` interface in `src/types.ts`. Key properties include:
- `id`: string
- `content`: string (The task description)
- `quadrantId`: string (`q1`, `q2`, `q3`, `q4`, or `inbox`)
- `completed`: boolean
- `createdAt`: number (timestamp)
- `completedAt`: number (timestamp, optional)
- `starred`: boolean (optional)

## Drag and Drop (DnD)
- Built using `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`.
- Users can drag tasks (`TaskTicket`) between different quadrants (`Quadrant`) and the Inbox.
- A `DragOverlay` is used in `App.tsx` to provide visual feedback while a task is actively being dragged.

## State Management
- `tasks` are managed in `App.tsx` and persisted to `localStorage` under the key `eisenhower-tasks`.
- Adding, editing, deleting, completing, moving, and starring tasks are all handled by functions in `App.tsx` and passed down as props to the quadrants and sidebars.
