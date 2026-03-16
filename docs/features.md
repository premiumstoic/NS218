# Features

## Weekly Module Organization
The overarching structure relies on chronological breakdown into weeks.
Each "Week" defines a curriculum subset encompassing notes, resources, simulations, discussions, and associated quizzes. Weeks operate in a draft ("hidden") mode until a Teacher flips them to `published`.

## Content Modalities
Teachers can deploy various educational modes:
- **Notes & Resources**: Flat markdown-rendered prose or links/assets.
- **Simulations**: Interactive sandbox widgets embedded in the class UI to demonstrate nanoscience concepts.
- **Flashcards**: Front-and-back study cards.
- **Quizzes**: Practice exams designed for iterative knowledge assessment. These offer instant feedback per option and support infinite retries.

## Threaded Discussions
Social engagement is captured via context-centric threaded comments. 
A comment chain can spawn at the macro-level (e.g., discussing Week 5 generally) or the micro-level (e.g., discussing a specific Flashcard item inside Week 5, or interrogating a specific student Upload).

## Student Upload Pipeline
Students can distribute assignments and materials to the cohort. 
The system enforces client-side file-type verifications and dynamically compresses large images (to WEBP) prior to dispatching it to Supabase bucket limits (25MB globally).

## Role Personalization
- **Students**: The default state for new users joining via OAuth or open sign-up. Access restricted to actively published modules.
- **Teachers**: Administrative accounts configured by environment overrides. Able to manage the lifecycle of content blocks (draft, publish, archive), modify student submissions, and moderate discussion boards.
