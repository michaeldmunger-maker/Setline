# Onboarding and Data & Privacy

Implemented October 27, 2026. Existing Arnold assets, training screens, schema v2, `setline-v1`, recovery keys, draft keys and app identifiers are retained. No dependencies or cloud accounts added.

## First launch and returning users

Welcome explains the purpose of Setline, then introduces the original Arnold. A starting-path screen offers import, manual latest lifting numbers, or starting fresh. Import reuses the existing editable review. Manual entry reuses the existing set-count and per-set builder. Starting numbers never create completed workout history.

Each path leads to a three-page, skippable logging guide: choose exercises, log a set, review/save. The guide creates no sample session. Each welcome/tour screen has one primary action.

`setline-onboarding-progress` stores the current page, import method/review position and guide page. Import drafts and pending manual values retain their existing keys. Onboarding is not marked complete merely because starting numbers were saved; completion/skip explicitly saves the completion flag before leaving the guide. A failed completion write offers retry.

Existing `onboarding.completed: true` flags remain valid without a particular welcome-version flag. When onboarding metadata is absent, existing progress is used to infer returning-user status while preserving all history, active sets, food, plans and preferences. Explicit incomplete setup remains incomplete. An unfinished session is never automatically discarded; if onboarding appears while one exists, welcome explains that it is safe and can be resumed or discarded later.

## Settings → Data & Privacy

Discard current workout requires confirmation and removes only the active session, including logged-but-unsaved sets. Completed history and every other state field remain unchanged.

Reset Setline first offers an optional JSON backup. That backup contains training, food, plans and preferences; it does not include Arnold drafts, chat or connection settings. On iPhone users must save it outside the app using the share sheet. The UI does not claim a file was saved merely because the sheet closed.

The final reset screen explains the deletion scope and requires typing `RESET`. It deletes Setline-owned local training and preferences, onboarding state/progress, drafts, Arnold chat/pairing settings, primary/recovery/daily saves and temporary import/backup files. External exported backups, photo-library originals, server-side API keys and external accounts are not deleted. Reset affects only the current device/browser container.

Settings and training management remain hidden from the visible three-tab bar but are reachable from their existing links. SDK 58's `href: null` redirect behavior prevented opening Settings; it now uses a hidden tab button/item instead, keeping URLs and visible navigation intact.

## Reset safety

- All AsyncStorage access goes through the shared storage lifecycle. Writes share a queue; mounted screens and async requests carry a generation scope.
- Reset immediately invalidates old scopes, disposes the training autosave controller and drains in-flight writes. Late draft/chat callbacks cannot write into the new generation, and old store callbacks cannot replace new state.
- A persistent `setline-reset-in-progress-v1` marker is written before deletion. All owned keys are removed and verified. Pending photo/backup file tasks settle and app-created cache files are removed before the marker is deleted.
- A failed or interrupted reset leaves the marker. Startup completes it before attempting normal primary/recovery loading. Failure presents a retry screen instead of restoring old data.
- Successful reset remounts the app with first-launch state and a fresh save controller. Old queued saves and recovery snapshots cannot repopulate it.

## Changed implementation

- `src/lib/storage-lifecycle.ts`, `local-storage.ts`, `local-files.ts`: write ownership, generation scopes, interrupted reset and app-cache cleanup.
- `src/lib/persistence.ts`, `store.tsx`: autosave disposal, completion-save result, reset lifecycle, stale callback protection and remounting.
- `src/lib/model.ts`, `onboarding.ts`: compatible onboarding decisions, progress cursor and discard-only helper.
- `src/components/arnold.tsx`, `quick-workout.tsx`: welcoming guide, retained import/manual state and reset-aware draft writes.
- `src/lib/arnold-client.ts`, `backup.ts`: reset-aware async replies and temporary-file lifetime.
- `src/components/data-reset-controls.tsx`, `src/app/(tabs)/you.tsx`: confirmed discard/reset and optional backup.
- `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`: reset progress/retry states and reachable Settings.
- `tests/reset-onboarding.test.mjs`, `tests/persistence.test.mjs`: new reset/onboarding tests and updated compatibility expectation.

## Validation

Typecheck, lint, 63 automated tests, iOS JS/Hermes export and production web build pass. The tests include normal-update continuity, missing onboarding metadata, interrupted setup, discard-only semantics, full reset, restart after partial deletion, file-cleanup failure, concurrent reset requests, stale callbacks, queued/in-flight writes and completion-write retry.

An isolated browser walkthrough verified fresh onboarding, note import/review across reload, saved starting numbers, a resumed walkthrough, onboarding completion across reload, workout logging/save, Settings navigation, cancelling and confirming discard, JSON backup download, disabled reset for incorrect text, full reset back to welcome, cleared old values/history, pending manual entry across reload, and new completion after reset. The exported test backup retained its one completed workout after local reset. No phone data was reset.

## Still test in Expo Go

1. Reload the updated app and verify existing history and any active workout are intact. Completed onboarding should not repeat.
2. Replay welcome from Settings to check layout, keyboard visibility, import/manual paths, skip and walkthrough copy on the actual phone.
3. Confirm a discard cancellation keeps the active session; confirm discard affects only that session.
4. Save a JSON backup to Files outside Setline and verify it exists before testing full reset on data you intend to delete.
5. Type `RESET`, confirm, then close/reopen Expo Go. Check welcome, no old workout, empty history and no old import/chat/connection settings. Check Settings restore preview with the external backup if desired.
6. Native share-sheet behavior, photo-picker/cache cleanup, application backgrounding/termination and storage failure behavior require device testing. Browser and model tests do not establish those native behaviors.
