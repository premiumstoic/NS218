# Teacher Dashboard Rework — Implementation Plan

## Goal

Replace the current single-page "wall of forms" with a sidebar + content-pane layout. The teacher selects a week in the sidebar; the right pane shows that week's content items and uploads. Creating and editing happens in a slide-over drawer, not inline.

**Desktop-first.** No mobile layout required for the teacher dashboard.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NS218 Teacher                              [Analytics →]        │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                    │
│  Weeks       │  Week 3 — Diffusion & Random Walks                │
│  ──────      │  Spring 2026 · Mar 17 · Active                    │
│  Wk 1  ✓    │  ─────────────────────────────────────────────    │
│  Wk 2  ✓    │  [+ Add content]  [Edit week]  [Archive]          │
│▶ Wk 3  ✓    │                                                    │
│  Wk 4  ○    │  Content                                          │
│  Wk 5  ○    │  📄 Lecture Notes          Published   [Edit] [⋮] │
│  ────────    │  🃏 Flashcard Deck (12)    Draft       [Edit] [⋮] │
│  Archived    │  📝 Quiz: Midterm Prep     Published   [Edit] [⋮] │
│  Wk 6  ✗    │                                                    │
│  ────────    │  Uploads (3)                                      │
│  [+ Week]   │  student_hw.pdf     published     [Hide]          │
│              │  notes_scan.jpg     hidden         [Show]         │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## Navigation Model

**URL param driven**: `/teacher?week=<id>`

- Server component reads `searchParams.week`
- If no week param → select first active week by default
- Sidebar links are Next.js `<Link href="?week=xxx">` (no full page reload via `prefetch`)
- Week selection does not require client state

This keeps the page server-rendered per selection, making it simple and bookmarkable.

---

## Drawer (Slide-over Panel)

All create/edit forms live in a drawer that slides in from the right. **No library needed** — it's a fixed-position panel + overlay + CSS transition (~40 lines of CSS).

```
Drawer states: closed | open
Trigger: any "Add content", "Edit", "Edit week", "New week" button
Content: swapped based on what was clicked (create week | edit week | create content | edit content)
```

The drawer is a client component (`TeacherDrawer`) that:
- Accepts `children` and `title` props
- Renders a backdrop overlay + slide panel
- Closes on overlay click or Escape key

---

## Toast Notifications

Replace all `setStatus(...)` + `<p className="subtle">` patterns with a lightweight toast system.

Use **`sonner`** — 3kB, zero config, works perfectly with Next.js App Router. Install with `npm install sonner`.

- Add `<Toaster />` to `app/layout.tsx`
- Replace status state in all teacher forms with `toast.success()` / `toast.error()`

---

## New File Structure

```
app/
  teacher/
    page.tsx                          ← server component, reads ?week param
    _components/                      ← teacher-only client components
      sidebar.tsx                     ← week list, archive toggle
      week-pane.tsx                   ← right pane (content + uploads for selected week)
      teacher-drawer.tsx              ← slide-over shell
      drawer-content-form.tsx         ← create content (wraps ContentEditorForm)
      drawer-content-edit-form.tsx    ← edit content (wraps ContentEditForm)
      drawer-week-form.tsx            ← create/edit week
```

> Using `_components/` (underscore = not a route) keeps teacher-specific client code co-located with the page and out of the global `components/` folder.

---

## Data Fetching Changes

Current: page fetches all content items (last 12) regardless of selected week.

New: page fetches content items **only for the selected week**.

```ts
// Current
supabase.from("content_items").select(...).limit(12)

// New
supabase.from("content_items").select(...).eq("week_id", selectedWeekId)
```

Also fetch quiz questions and flashcards only for that week's content items (same logic as before, but scoped to the selected week). This makes the page faster and the data set manageable.

Weeks list is always fetched in full (needed for sidebar).

---

## Implementation Steps

### Phase 1 — Infrastructure
1. Install `sonner`, add `<Toaster />` to `app/layout.tsx`
2. Build `TeacherDrawer` component (overlay + slide panel, Escape/click-outside to close)
3. Add drawer CSS to `globals.css`

### Phase 2 — Sidebar
4. Build `Sidebar` component: week list with `<Link href="?week=id">`, active state, published/archived badges, "+ New Week" button at bottom
5. Build the sidebar CSS (fixed width, scrollable week list)

### Phase 3 — Week Pane
6. Build `WeekPane` component: week header (title, date, status badges), action buttons (Add content, Edit week, Archive/Restore), content item list, uploads list
7. Content item row: type icon, title, published status badge, Edit and delete/options buttons
8. Upload row: filename, status badge, toggle button

### Phase 4 — Rewire Teacher Page
9. Rewrite `app/teacher/page.tsx` to read `?week` param, fetch week-scoped data, compose Sidebar + WeekPane
10. Wire all action buttons to open the drawer with appropriate form

### Phase 5 — Forms in Drawer
11. Move `WeekEditorForm` / `WeekEditForm` into drawer context, convert status messages to toasts
12. Move `ContentEditorForm` / `ContentEditForm` into drawer context, convert status messages to toasts
13. Convert `UploadStatusToggle` to toast feedback

### Phase 6 — CSS cleanup
14. Extract repeated inline `style={{}}` patterns to CSS classes (`.row--between`, `.page-header`, etc.)
15. Fix known bugs: dark mode `--danger` typo, analytics page `.container-main` class

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/teacher/_components/teacher-drawer.tsx` | Slide-over shell |
| `app/teacher/_components/sidebar.tsx` | Week list sidebar |
| `app/teacher/_components/week-pane.tsx` | Selected week content pane |

## Files to Modify

| File | Change |
|------|--------|
| `app/teacher/page.tsx` | Full rewrite: read `?week` param, compose new layout |
| `app/layout.tsx` | Add `<Toaster />` from sonner |
| `components/forms/week-editor-form.tsx` | Replace status state with `toast` |
| `components/forms/week-edit-form.tsx` | Replace status state with `toast` |
| `components/forms/content-editor-form.tsx` | Replace status state with `toast` |
| `components/forms/content-edit-form.tsx` | Replace status state with `toast` |
| `components/forms/upload-status-toggle.tsx` | Replace status state with `toast` |
| `app/globals.css` | Drawer styles, layout utilities, bug fixes |

## Files to Keep Unchanged

- All API routes (no backend changes needed)
- Quiz builder / flashcard builder components
- Analytics page (separate concern, tackle later)

---

## Explicitly Out of Scope

- Student-facing pages (separate plan)
- Analytics page redesign
- Mobile layout for teacher dashboard
- Content deletion (not currently implemented anywhere)
