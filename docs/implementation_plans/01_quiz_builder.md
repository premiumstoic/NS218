# Quiz Builder — Implementation Plan

## Goal

Replace the raw JSON textarea in `ContentEditorForm` with a visual quiz builder. Teachers should be able to add questions one at a time, set question type, write options, mark correct answers, add explanations, and reorder questions — without touching JSON.

The same builder should load existing quiz data when editing (`ContentEditForm`), replacing the current edit form which cannot touch quiz questions at all.

---

## Scope

- **In scope**: Visual create + edit for quiz content items
- **Out of scope**: Flashcard builder (separate plan), simulation/note/resource types (unchanged)

---

## Data Model (existing, no DB changes needed)

```
QuizQuestion
  prompt: string
  question_type: "single_choice" | "multiple_choice"
  explanation: string | null
  order_index: number
  options: QuizOption[]

QuizOption
  text: string
  is_correct: boolean
  order_index: number
```

Constraints already enforced by Zod:
- At least one option per question (enforced on submit)
- Single choice: exactly one `is_correct` option
- Multiple choice: one or more `is_correct` options

---

## New Component: `QuizBuilder`

**Location**: `components/forms/quiz-builder.tsx`

**Props**:
```ts
interface QuizBuilderProps {
  value: DraftQuestion[];
  onChange: (questions: DraftQuestion[]) => void;
}
```

**Local types** (used only in the builder, converted to API shape on submit):
```ts
interface DraftOption {
  id: string;        // local key (crypto.randomUUID), never sent to API
  text: string;
  is_correct: boolean;
}

interface DraftQuestion {
  id: string;        // local key, never sent to API
  prompt: string;
  question_type: "single_choice" | "multiple_choice";
  explanation: string;
  options: DraftOption[];
}
```

### UI Layout (per question card)

```
┌─────────────────────────────────────────────────┐
│ Question 1                          [↑] [↓] [✕] │
│                                                   │
│ [single choice ▾]                                 │
│                                                   │
│ Prompt                                            │
│ ┌─────────────────────────────────────────────┐  │
│ │                                             │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ Options                                           │
│ ○ [Option text ________________] [✕]             │
│ ○ [Option text ________________] [✕]             │
│   [+ Add option]                                  │
│                                                   │
│ Explanation (shown after attempt)                 │
│ ┌─────────────────────────────────────────────┐  │
│ │                                             │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

[+ Add question]
```

**Correct answer selection**:
- `single_choice` → radio buttons (selecting one auto-deselects others)
- `multiple_choice` → checkboxes

**Reorder**: Up/down arrow buttons on each question card (no drag-and-drop for now; can be added later)

**Validation UI** (inline, before submit):
- Question with no prompt → red border + "Question prompt is required"
- Question with < 2 options → "Add at least 2 options"
- `single_choice` with 0 or >1 correct → "Mark exactly one correct answer"
- `multiple_choice` with 0 correct → "Mark at least one correct answer"
- Option with empty text → "Option text cannot be empty"

---

## Changes to Existing Components

### `ContentEditorForm` (`components/forms/content-editor-form.tsx`)

When `type === "quiz"`:
- Remove the `questionsJson` textarea
- Render `<QuizBuilder value={questions} onChange={setQuestions} />`
- On submit, convert `DraftQuestion[]` → API shape (strip local `id` keys, assign `order_index` from array position)

### `ContentEditForm` (`components/forms/content-edit-form.tsx`)

Currently cannot edit quiz questions at all. Changes needed:
- Accept optional `questions?: QuizQuestion[]` prop (fetched by the parent page)
- When `content.type === "quiz"`, render `<QuizBuilder>` pre-populated from the prop
- On save, include `questions` in the PATCH body (API already supports full replacement)

### Teacher Dashboard Page (`app/teacher/page.tsx`)

The page fetches recent content items but does not currently fetch their questions. Add a fetch for questions when rendering `ContentEditForm` for quiz items:

```ts
// For each content item of type "quiz", fetch questions + options
const { data: quizQuestions } = await supabase
  .from("quiz_questions")
  .select("*, options:quiz_options(*)")
  .in("content_item_id", quizContentItemIds);
```

Pass the matching questions as a prop to each `ContentEditForm`.

---

## Implementation Steps

1. **Create `QuizBuilder` component** with empty state (no questions) and "Add question" button
2. **Implement question card**: prompt textarea, type selector, explanation textarea, delete button
3. **Implement options within a question**: add/remove options, correct-answer radio/checkbox logic
4. **Implement reorder**: up/down buttons, swap adjacent items in array
5. **Implement inline validation**: run on submit attempt, highlight invalid cards
6. **Wire into `ContentEditorForm`**: replace JSON textarea with `<QuizBuilder>` for quiz type
7. **Update `ContentEditForm`**: add `questions` prop, render `<QuizBuilder>` pre-populated for quiz type
8. **Update teacher dashboard page**: fetch quiz questions for quiz-type content items, pass to `ContentEditForm`
9. **Smoke test**: create a quiz via builder, submit, verify in student quiz player; edit existing quiz, verify changes persist

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/forms/quiz-builder.tsx` | New visual quiz builder component |

## Files to Modify

| File | Change |
|------|--------|
| `components/forms/content-editor-form.tsx` | Replace JSON textarea with `<QuizBuilder>` for quiz type |
| `components/forms/content-edit-form.tsx` | Add `questions` prop, render `<QuizBuilder>` for quiz type |
| `app/teacher/page.tsx` | Fetch quiz questions for quiz items, pass to `ContentEditForm` |

---

## No API or DB Changes Required

The existing `POST /api/teacher/content` and `PATCH /api/teacher/content/[id]` already accept the full question+options structure. The builder just needs to produce that shape on submit.
