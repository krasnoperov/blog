# Offline-first Mafia Night

Run the game even when the room has no internet, the device is in airplane mode, or the venue Wi-Fi drops halfway through the night.

## Why it matters

- The host device should never depend on a live backend to continue the game.
- Game state, settings, and session history should stay on-device first.
- Remote sync should be optional and resumable, not required for core play.

## Product principles

- Local play is the source of truth during a session.
- Sync is additive. If it fails, the game still works.
- Recovery is simple. Re-open the app and continue from saved local state.

## What this foundation gives you

- A dedicated `/app` shell designed for offline-first local state.
- A persisted queue for future sync jobs.
- A service worker setup that keeps the shell available after first load.
- A clean separation between public marketing pages and the game runtime.
