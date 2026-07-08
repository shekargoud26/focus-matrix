# Sidebars & Drawers

The application features several sidebars and slide-out drawers to handle tasks that don't currently sit inside the 4-quadrant matrix.

## Inbox
**Components**: `src/components/InboxContent.tsx`, `src/components/InboxDrawer.tsx`

The Inbox holds tasks that have been captured but not yet categorized or prioritized into a specific matrix quadrant.
- **Data**: Tasks with `quadrantId === 'inbox'`.
- **Desktop View**: On ultra-wide screens (`2xl`), the Inbox is permanently visible as a persistent sidebar (`<aside>`) to the right of the matrix.
- **Mobile/Standard View**: For smaller screens, the Inbox is accessed via a button in the header, which opens `InboxDrawer.tsx` (a slide-out panel from the right).

## Archive / Completed Tasks
**Component**: `src/components/ArchiveDrawer.tsx`

The Archive holds tasks that have been completed.
- **Data**: Tasks with `completed === true`.
- **Functionality**: Users can view their completed tasks and restore them to their previous state if needed.
- **UI**: Accessed via a button in the header, sliding out from the right side of the screen.

## Drawer Implementation
- Drawers use a custom backdrop overlay (`fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-50`).
- The panel itself uses `motion.div` from `motion/react` to animate sliding in and out.
- Focus management and accessibility should be maintained when opening/closing these panels (e.g., closing on escape key, trapping focus if necessary).
