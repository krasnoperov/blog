# Local-first Sync Architecture

The app should treat local persistence and sync as separate concerns.

## Recommended model

1. Write every important mutation to local storage immediately.
2. Enqueue a sync job only if remote sync is enabled.
3. Retry sync when the device is online again.
4. Never block the host flow on a network round-trip.

## Suggested boundaries

- UI state: local store
- Durable session data: persisted local records
- Remote transport: optional adapter
- Conflict handling: explicit and delayed, not in the hot path

## Why this starter uses a queue

A queue makes sync unplug-able. You can ship a fully local app first, then add remote adapters later without rewriting the core game flow.
