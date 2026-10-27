# Setline: start here

Current snapshot: October 26, 2026. Read this before the README, which also contains older implementation notes.

## Purpose

Make gym logging faster than a notebook: remember previous sets, reps and weights, log the next set quickly, and retain progress every day. The owner uses the app personally and improves it through real workouts. Optional nutrition and planning should stay secondary.

Arnold is an original weight-plate coach mascot. The approved look is charcoal/black, lime accents and category colors. Keep onboarding simple and reveal complexity gradually. Approved visual references are in `design/approved-flows/`.

## Current experience

1. Minimal Welcome to Setline screen with Continue.
2. Meet Arnold: Paste my workout notes, Upload workout photos, Enter my numbers manually, or Start fresh. The first three buttons are dark; Start fresh is green.
3. Notes/photos lead to editable exercise review, then explicitly save starting numbers. Starting numbers mean the last sets, reps and weight performed, not a required one-rep max. Pasted notes have a limited offline parser; AI and photo interpretation need the optional server.
4. Manual entry: choose exercise, choose set count with +/−, then set reps and weight per set with +/−.
5. Start fresh leads directly to Today. Choose exercises and start training without naming a routine.
6. Training shows completed sets and a current set, previous numbers, rest timer, exercise switching and adding exercises. Finish reviews and saves checked sets only. Today then offers Repeat last workout.

Visible tabs: Today, Progress, Arnold. Training management and settings still exist as secondary routes. Food and scheduling are optional.

Workout logging now shows previous performance automatically with its source. The current set stays above the set list, with full-width 48-point stepper controls and a pinned Log set action. Unlogged values are labeled as editable suggestions. Logging carries numbers into the next blank set only when it has no prior target, numbers, note or marker; existing future entries stay intact. Completed-set edits and repeated completion do not restart rest. Extra routine sets reuse the last known reps as unchecked suggestions. No storage schema or recovery changes were made.

While typing workout notes, a compact Done toolbar and expanded notes field replace the surrounding page content. Done restores the review action without losing text. Browser focus/scrolling was checked; the actual iPhone software keyboard still needs user testing.

## Run and verify

This is a standalone Expo SDK 58 / React Native 0.88 project with Expo Router. Use a current Node.js version that supports the test runner's `--experimental-strip-types` flag.

```sh
npm ci
npm start -- --go --lan
npm run typecheck
npm run lint
npm test
npm run export:ios
```

Expo Go must support SDK 58. Phone and development Mac need to reach each other on the network. `npm run web` provides a browser preview. The iOS export checks the JS/Hermes bundle; it is not a signed app or a physical-device runtime test.

On this snapshot: typecheck, lint, all 44 tests, iOS export and all 20 Expo Doctor checks passed. The SDK 58 manifest was verified on the LAN development server. Workout logging was also checked at 390×844 and 375×667 in an isolated browser preview: automatic previous numbers, logging, edits, undo, rest extension/skip and reload continuity passed without horizontal overflow. Native keyboard, safe areas, thumb reach and background/resume still need physical iPhone testing.

## Data must survive changes

- Keep storage key `setline-v1`, slug `setline-training`, scheme `setline`, and native identifiers `com.setline.prototype` stable.
- Schema v2 migrates existing v1 data. Never reset real data to seed data. Unknown future schemas and failed reads must preserve stored contents.
- Local writes are serialized with previous and daily recovery copies. Active sessions and temporary edits persist.
- Starting numbers are exercise baselines; they must not create fabricated completed workout history.
- Data is local to each browser origin/device/container. There are no cloud accounts or cross-device sync. Export a JSON backup before changing storage environments, uninstalling or clearing app data.

GitHub stores the source code, not the owner's live workouts or food log. Pushing code does not sync personal training data. Keep `.expo`, environment secrets, generated bundles, and personal exports out of Git.

## Code map

- `src/app/`: Expo Router routes and tabs.
- `src/components/arnold.tsx`: import, review, AI connection and coach UI.
- `src/components/quick-workout.tsx`: manual exercise/set builder.
- `src/components/ui.tsx`: shared theme, screen layout, controls and keyboard behavior.
- `src/app/workout.tsx`: active workout and finish review.
- `src/lib/model.ts`: training model, validation, migration, sessions, baselines and history.
- `src/lib/store.tsx`, `persistence.ts`, `backup.ts`: hydration, local autosave, recovery and exports.
- `src/lib/arnold.ts`, `arnold-client.ts`: import parsing/validation and optional service requests.
- `server/`: paired local AI service and setup instructions.
- `tests/`: model, persistence and mocked AI/server tests.

## AI and production limits

No live OpenAI call has been verified in this session. Photos and AI chat require a server-side API key, API billing and the paired local service described in `server/SETUP.md`. A ChatGPT subscription does not configure that service. Secrets never belong in public client variables or Git. The local service is a development setup, not a hosted production backend.

There is no App Store release, signed standalone build, cloud sync, barcode database, automatic nutrition estimation or background timer notification. UI screenshots and builds do not prove physical-device behavior.

For a useful review, trace a full first-run → import/manual/fresh → workout → save → relaunch journey. Report concrete user obstacles and propose one focused improvement at a time. Preserve existing data and the approved visual direction.
