# Setline — proposed organization

Concept design, not an implemented UI update. Generated boards use illustrative workout data, not actual user records.

## Main navigation

| Tab | Primary job | Secondary tools |
| --- | --- | --- |
| Today | Start or resume the next workout | Change/edit routines; optional food log; plan next session |
| Progress | Review saved training | Workout history, exercise histories, comparable-unit records and trends; nutrition history if enabled |
| Arnold | Ask for help or import information | Old-note/photo import, explain previous sessions, discuss next-session options and review scheduling drafts |

On phones use three bottom tabs. On desktop use the same three destinations in a slim sidebar. Settings lives behind a gear: name, units, preferences, save status, backup/recovery and connection settings. Routine management belongs behind Change routine. Planning belongs behind Plan next session. Neither needs another main tab.

## First use

1. Arnold introduces himself. Offer Bring my workouts or Start fresh. No compulsory goals, nutrition targets or profile questionnaire.
2. Import path: paste one workout or choose a photo. Explain what will be sent before AI reading. Show the resulting draft, preserve shorthand and highlight missing details. Fresh path: name a workout and choose its exercises; starting loads can be entered during training.
3. Confirm only details that matter now. Make exercise rows expandable rather than exposing every possible field. Missing date means save as routine; dated history requires explicit date confirmation. Ask about uncertain units rather than silently converting plate labels.
4. End setup as soon as one usable routine exists. Open Today with one prominent Start workout action. Introduce the three tabs here, without a tutorial covering every tool.
5. During the first session, use small contextual hints for editing a load, checking a set and moving on. Save progress as the person logs it. A quiet save indicator distinguishes saving, saved and failed writes.
6. Finish with a concise saved summary and an optional next action. Keep the next launch on Today or an unfinished session; do not repeat onboarding.

## During a workout

Focus on one exercise. Keep last-session numbers visible, preserve each set's units, prefill unchecked values, and make load/reps/check controls easy to tap. Completing a set starts rest. Notes, form markers and Arnold remain secondary actions. Next exercise is the main button. Finish workout is explicit. Returning to Today retains the active session and timer. No endless expanded form of every exercise.

## Gradual setup

Offer food tracking as a dismissible invitation. Once enabled, Today gets a compact food row leading to meals, favorites, calories and optional macros/targets. Do not repeatedly ask users who decline. Ask about scheduling only when they choose planning. Show meaningful progress from real logs as it accumulates; do not lock history behind milestones or fabricate records. Arnold should assist on request, not interrupt every action. Additional features are optional, not a checklist needed before training.

## Boards

- `setup-journey.png`: four stages from welcome to Today.
- `everyday-app.png`: Today, focused workout logging, Progress and Arnold.

## Image-generation prompt briefs

Tool: built-in image generation. Style: premium ink black #0B0E11, charcoal #14191F, lime #CCFF55, restrained chest violet/back blue, spacious readable typography and original graphite/lime weight-plate Arnold.

Setup board prompt: four mobile screens titled Meet Arnold, Bring what you have, Check it together, Ready to train. One primary action per step. Show pasted weighted pull-up notes, a compact editable routine preserving Plate + 25, then a focused Today card. No tabs until ready, no initial nutrition targets, questionnaires or technical settings.

Everyday board prompt: four screens for Today, an active workout, Progress and Arnold. Today emphasizes Start workout with optional food and planning links. Workout shows one exercise, last numbers, a three-set table, rest timer and Next exercise. Progress contains one simple training trend and recent sessions. Arnold contains suggested questions, an import action and history-grounded conversation; advice never silently changes weights. Use only Today, Progress and Arnold as the main tabs.

Identity refinement prompt: preserve all everyday-board layout, UI text, controls and chart; replace mascot renderings with the approved original graphite/lime grip-plate character from arnold-coach-welcome.png, retaining the warm eyes, friendly smile above a distinct bore, towel, lifting belt and violet wrist wrap. Simplify tiny avatars while keeping the same face.
