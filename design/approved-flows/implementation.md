# Approved Setline flows

The user approved these two image concepts for implementation. They were generated with the built-in image tool, using the existing welcome screenshot as the design and Arnold mascot reference. The original welcome screen and Arnold introduction remain intact.

- `import-flow.png`: Paste notes **or** upload photos → review exercise tables → save starting numbers → ready to train. The two intake screens are alternatives, rather than consecutive required steps.
- `manual-and-fresh-flow.png`: Choose an exercise → confirm set count → adjust reps and weight for each set with +/- controls. Start fresh → Today → select exercises → log sets during training.

## Implemented behavior

Import entry and review use a persistent bottom action, progress marks, charcoal exercise cards, and the original lime-accented Arnold mascot. Multiple photos (up to four, one session per request) can be selected, previewed and removed. Photos remain temporary until read; the service never writes them to disk. Paste imports work offline; AI/photo reading needs the existing configured Arnold connection. Review can merge another notes/photo batch before saving. Baselines are separate from dated completed workouts.

Manual entry has a large set-count stepper and compact individual set cards. Reps and weight use the same stepper component in setup and live sessions. Workout selection creates a session directly without creating a routine or seeding someone else's numbers. Existing baselines and completed history prefill relevant exercises. Users can add another exercise to an active session without losing sets or rest time. Only explicitly logged sets enter history. Today offers Repeat last workout after the first completed session.

## Source prompts

The first concept requested four front-facing phone screens in Setline's established black/charcoal/lime palette: paste notes, upload photos, a shared editable set-table review, and a ready confirmation with Arnold. It specified import-first setup with no routine naming, one-rep-max requirement, nutrition setup, or fabricated completed history.

The second requested two rows of three phones: manual exercise selection, a single large set-count control, compact per-set reps/weight controls; then a fresh Today screen, exercise selection, and live logging with completed set summaries, one active set, a rest timer, and Log set / Next exercise controls.
