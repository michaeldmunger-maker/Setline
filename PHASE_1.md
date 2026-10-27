# Phase 1: complete workout journey

Implemented October 26, 2026. The reference image guides hierarchy and progressive simplicity; unrelated onboarding, home, progress, nutrition and AI features were not rebuilt. Existing Arnold art, Expo SDK 58, routes, schema v2, storage keys, migrations, autosave and recovery are retained. No dependencies added.

## Changed files

- `src/app/choose-exercises.tsx`: search with muscle filters, explicit selection states, a three-step custom exercise builder, and entry to active-session setup.
- `src/components/exercise-choices.tsx`: optional multi-selection appearance with muscle labels and add/check icons; existing manual builder behavior remains available.
- `src/components/exercise-setup.tsx`: two-step set-count and starting-number setup, with previous performance, editable per-set targets and autosaved changes. Existing targets and logged sets are protected. Newly selected exercises are set up when reached, within the existing workout route. Setup navigation position is transient; entered values persist in the active session.
- `src/components/previous-performance.tsx`: shared, automatically visible previous numbers with source labels.
- `src/app/workout.tsx`: setup integration, inline confirmation that clears after 2.2 seconds, pinned rest extension/skip, current-set count, exercise completion state, and final review totals. Existing editing, undo, notes, adding sets/exercises and finish/save behavior remain.
- `src/components/workout-totals.tsx`: shared completed-only exercise/set/rep/duration/volume totals for review and saved history.
- `src/app/history/[id].tsx`: saved workout uses the same totals as review.
- `src/lib/model.ts`: safe active-set resizing, blank-target suggestions, and pure completed-only summary calculations. No stored fields or migrations changed.
- `tests/workout-journey.test.mjs`: six tests covering setup continuity, completed-set protection, suggestion preservation, mixed-mode/unit totals, zero/unknown loads, and setup → log → reload → review → save.
- `PROJECT_STATUS.md`: updated current flow and verification count.

## Behavior and limits

Numbers are suggestions until the user explicitly logs a set. Setup does not add completed history. Only logged sets enter the final saved session. Numeric weight × reps is reported separately for lb and kg. Weighted bodyweight uses added weight only. Bodyweight, timed holds, and plate/machine labels are excluded from load volume; holds are reported in seconds. No body weight, machine resistance or plate totals are inferred.

There is no new AI progression advice, account system or cloud sync. Data remains local; retain external JSON backups for device loss/uninstall. Setup edits autosave using the existing provider. If navigation position is lost on relaunch, resume the active workout with its retained numbers rather than resetting it.

## Verification

- TypeScript, lint, 50 automated tests, iOS JS/Hermes export, and browser production build pass.
- An isolated browser walkthrough covered fresh onboarding, combined search/filter, custom exercise creation, per-exercise setup, two consecutive weighted sets, a timed exercise, exercise switching, reload persistence, final review and saving to history.
- The walkthrough counted two 100 lb × 10 sets and one 60-second hold as 3 sets, 20 reps and 2,000 lb volume; two unlogged timed suggestions were excluded. Saved history matched review.
- Browser layouts were inspected at iPhone dimensions. This does not verify native keyboard or device behavior.

## Test manually in Expo Go

1. Resume an existing workout after updating. Check its weights, reps, notes, logged flags and timer before making changes.
2. Select multiple exercises using search and filters. Create a custom exercise. Configure counts and distinct per-set numbers; confirm suggestions are not marked logged.
3. Use one hand to adjust and log consecutive sets. Check brief feedback, automatic next-set focus, edit/undo, exercise switching, and add-set/add-exercise actions.
4. Type numbers and notes with the software keyboard. Check scroll visibility, primary-button reach, keyboard dismissal and safe-area spacing, including a smaller iPhone and larger text settings.
5. Extend and skip rest. Background the app or lock the phone, return, and confirm countdown and entries persist. There are no background timer notifications.
6. Leave sets unlogged. Review, return to training, then save. Verify only completed sets appear in history and mixed lb/kg volumes stay separate. Plate labels, bodyweight and holds must not produce guessed weight volume.
7. Close/reopen Expo Go and confirm the saved workout and previous performance remain available. Keep a training backup outside Expo Go.
