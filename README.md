# Setline

Start with [PROJECT_STATUS.md](PROJECT_STATUS.md) for the current product flow, code map, verification and data-preservation rules. Sections below also retain earlier implementation notes.

A separate workout-focused prototype using Dayline's dark design. The name is provisional.

## Run

- `npm start` — open in SDK 58 Expo Go on the same Wi-Fi, signed into the same Expo account.
- `npm run web` — browser development preview.
- `npm run build` — browser deployment output in `dist`.
- `npm run export:ios` — iOS JS/Hermes bundle (not a signed IPA).
- `npm run typecheck`, `npm run lint`, `npm test` — verification.

## Included

Today training overview, active workout autosave, per-set loads/reps or durations, rest timer, quality flags and notes, previous-session prefill, custom routines and exercises, notebook reference data, completed-session history, exercise records and charts, weekly scheduling, optional manual food and macro log, user-entered goals, quick meals, JSON backup export and restore.

The two starting routines use the user's own notes. They are **reference data**, not fabricated completed sessions. Plate labels are not converted into guessed numeric weights. Uncertain machine resistance stays a note. Numeric records compare the same exercise and unit only; labels/bodyweight use reps and timed exercises use duration. Unchecked sets do not count toward saved history.

## Prototype limits

Data is local to each browser/device and not synchronized. No cloud accounts, AI nutrition estimation, barcode database, subscriptions, OS calendar integration, background timer notifications, or App Store submission. Manual nutritional values are not database-verified. A blank calorie field estimates calories from entered macros with 4/4/9 and is labeled accordingly. Goals are entered by the user; the app does not prescribe targets.

Default rest is used for newly created exercises; reference routines keep their exercise rest settings. Workout timers retain absolute timestamps across navigation/relaunch but do not issue background alerts. Export a backup to move data between browser and phone. Startup failures leave saved data untouched instead of overwriting it with a fresh demo.

Before production: native-device QA, authenticated cloud persistence, lifecycle/backup hardening, final icons/branding, dependency-advisory review, accessibility review and signed TestFlight builds. The official starter currently includes upstream development-tool advisories. No paid services or store submissions were initiated.

## Arnold

The Arnold tab imports pasted notes offline into an editable draft, or uses an optional AI service to read notes/screenshots and answer questions grounded in logged training. Choose routine vs dated history, link existing exercises, review all values, and explicitly approve. Nothing is silently added. Workout screens link directly to Arnold. See [server/SETUP.md](server/SETUP.md) for live AI setup and privacy/availability limits. Live OpenAI requests have not been verified without an API key.

## Data continuity and first-run welcome

On a fresh install Arnold welcomes you and immediately offers pasted-note and photo import, with an option to start without importing. Approving an import or continuing completes the welcome once. You can reopen it in You. Existing users also see the introduction once. A separate welcome version records explicit completion, so old migration flags cannot accidentally skip it. The root navigator gates all app routes, including restored workout deep links, until that introduction is completed.

Schema v2 migrates existing v1 saves and backup files. **Keep `setline-v1` as the storage key, the app slug `setline-training`, scheme and native bundle/package identifiers stable. Never replace real saves with seed data during an update.** Training loads before navigation mounts. A failed load shows a recovery screen; unknown newer schemas are preserved and require the newer app. Never silently downgrade them to older recovery data.

Writes are serialized. Before replacing a save, the previous valid state is copied to a recovery slot; a separate daily slot retains the state before the first change of that local day. Invalid primaries can automatically fall back to readable recovery copies. You can preview and explicitly restore copies in You. Save status reflects completion of storage writes and offers retry on failure. In-progress sets, including temporary blank inputs mid-edit, reload without being mistaken for corrupt finished workouts.

Export backup file downloads JSON on web and opens native file sharing on phones. On iPhone choose Save to Files and keep it outside the app. Restore currently uses pasted backup JSON with a preview and explicit replacement confirmation. Automated copies are on the same device; they do not survive uninstall/storage clearing/device loss. No cloud account or cross-device sync is implemented. Browser saves belong to the exact origin; Expo Go and a standalone installed app use different storage containers. Export/import when changing these environments. A standalone/TestFlight build is still needed for daily use independently of the development server.

## Arnold design implementation

The approved graphite/lime Arnold cutout is in `assets/arnold/welcome.png`; its generation brief and provenance are alongside it. The welcome now starts with the mascot and two clear paths. Bring my workouts opens a compact import composer and collapsed exercise review; Start fresh names a first workout and chooses exercises, then opens Today. Older saved sessions, food and routines are retained. Welcome version 2 shows this new introduction once without changing the stable storage key or application identifiers.

Visible navigation is Today, Progress and Arnold. The existing `/train` and `/you` routes remain compatible but are hidden from the tab bar: Change routine opens training management; the gear opens settings. Today emphasizes start/resume. Food tracking is optional; its invitation appears after a saved workout and can be dismissed persistently. Planning stays a secondary link. Progress shows recent sessions and compact record links; detailed exercise charts remain available by tapping an exercise.

Workout mode shows only the current exercise with previous numbers, set inputs and checkmarks. Tap a set number for notes/form markers. Next/Previous and the exercise switcher preserve all session entries and the absolute rest deadline. Finish explicitly saves checked sets. The exercise position, partial edits and timers persist through restart. No live AI/API or production account setup was added by this visual update; those existing connection requirements remain.

Verified using separate browser origins for test data: import → review → routine, old active-session continuity, checked-set save, next-exercise/reload persistence, and fresh setup → two-exercise routine → three-tab Today. Physical iPhone layout and native sharing still require a device check.

The welcome flow now begins with a minimal “Welcome to Setline” screen and a single Continue action before Arnold appears. Arnold’s buttons consistently say “Bring my workouts” and “Continue to my training”; saved draft state no longer changes the first import invitation into “Continue my workout import”. Returning users can continue to Today, while first-time users can choose exercises for a first routine.

## Clearer workout collection setup

Arnold now explains the objective: add the workout sessions you already do so Setline can keep exercises, weights and reps together. Add my workouts opens an explicit choice of pasted notes, a workout photo or exercise-by-exercise creation. Each explains what information to provide. One workout is enough to start; adding an entire training history is optional.

The import UI labels Add → Check → Saved, asks for a recognizable workout name and explains reusable workouts versus past completed sessions in plain language. Notes parsing remains available without AI; live AI reading options are secondary and photos clearly state the connection requirement. A saved draft is offered explicitly rather than automatically replacing the entry screen.

After each save, a confirmation offers Add another workout or Continue to my training. Today has an Add a workout entry point; My workouts and Arnold also expose it. Unique request parameters reset the chooser when revisiting the same Arnold tab. Existing saved records, unfinished sessions and pending import drafts are retained. The same manual builder works both during and after onboarding.

### Tap-to-build exercise setup

The first Arnold action and Today’s **Add exercises** now open exercise buttons directly. Search or filter by muscle group, tap an exercise, choose the number of sets with +/- and confirm, then use separate +/- controls for the reps and weight of each set (or leave weight for the gym). Bodyweight, timed holds, added weight, and plate labels retain their own logging modes. Each set has its own numbers, supporting entries such as 12, 11, 10 reps. Going back to change the count preserves numbers for the remaining sets. Missing exercises can be created inline, and workout naming is optional.

Added exercises are saved in a separate local draft so reopening the builder resumes them. Saving creates routine-specific targets without replacing notebook references or completed history; targets prefill the first session and actual completed numbers are used on subsequent sessions. Existing backups remain compatible. Notes and photo import remain accessible from **Use notes or a photo instead**.

### Last-workout starting numbers

Welcome setup now asks for the sets, reps and weight from the user’s most recent workout, rather than asking them to build an entire routine or provide a one-rep max. The form uses the simple label **Weight**. Starting numbers have a separate local draft and save on each exercise as a baseline; saving them preserves routines, notebook references and completed sessions. These baseline numbers prefill the first session when no completed history or explicit routine targets exist. Progress and exercise details show them separately from dated workout records, and Progress includes an option to add or update them. Arnold’s supplied context includes these starting numbers separately from recent completed workouts.

### Import-first entry

Arnold’s introduction now puts **Paste my workout notes** and **Upload workout photos** first, followed by **Enter my numbers manually**. Today and Progress entry points open the same import-first chooser with manual entry as an alternative. During starting-number setup, approving parsed notes or a photo draft saves exercise baselines without creating a routine or completed session. Text parsing remains available offline; live AI/photo reading still requires the configured Arnold service. Imports are reviewed before saving and processed one session at a time.

### Approved mockup implementation

See `design/approved-flows/` for the approved concept boards and the implementation map. The two welcome screens are preserved. Import and manual setup now use compact charcoal cards, simple progress marks, and pinned primary actions. Import review shows each set’s weight and reps in a table, allows edits and another notes/photo batch, and leads to the mascot confirmation with **Ready to train** / **Add more exercises**.

**Start fresh** opens Today’s **Start my first workout** path. Exercise selection starts training directly; no routine needs to be named or saved. Initial values come only from the selected exercise’s saved baseline or completed history. Live training uses +/- set controls, completed-set summaries, a compact persistent rest timer, and an explicit final review. Exercises can be added mid-session. After saving a session, Today offers **Repeat last workout**.

Photo import now accepts up to four photos per request, with the existing total upload cap. The updated `server/reader.mjs` must be running for multi-photo AI requests. Restart `npm run arnold` after updating an already-running service. No live OpenAI call was needed to verify the UI: request formatting and limits are covered with mocked API responses. Pasted notes still work offline. AI photo reading requires the existing server-side key and paired connection; selected photos are temporary and are never written to the service’s disk.
