# Implementation Process

~80% of this app was built with AI (Claude Code). My role: architecture,
review, decisions, and integration. Log below, in order.

## Tools

- **Claude Opus** - architecture planning (this doc's basis)
- **Claude Code** - implementation, slice by slice
- **VS Code** - editing, review, diffs
- **Expo Go** (physical Android device) - run + manual QR/scan testing
- **Git** - one commit per slice, so the log here maps to history

## Log

### 1. Architecture (Opus)

Asked Opus to act as architect - stack, folder structure, API layer,
state management, deliberate tradeoffs - no code, prompt below:

```
You're my software architect for a take-home React Native challenge. I'm a
senior dev with a 4-6 hour budget. No code yet — architecture plan only.

This is graded on judgment (where I spend time vs where I skip) and requires me
to document my AI-assisted process, so be decisive. I want decisions with
reasoning, not menus of options.

API spec: *see attached file along

Deliver this, concise and opinionated:

1. Stack — Expo vs bare RN CLI for this scope, one clear call, justified. Note
   QR scanning is required, so factor in how each path handles the camera.
2. Folder structure — full tree, production-sane, not over-engineered for a
   4-6h build.
3. API layer — single typed client, token injection, error handling.
4. State — auth/token persistence + server state (points/rewards), and exactly
   how the points balance stays in sync after a scan or redeem.
5. Screens + navigation flow.
6. Deliberate tradeoffs — pick ONE area to go deep (architecture / tests /
   design / perf), state what I consciously skip, and defend the choice.
7. Risks — token/auth expiry, insufficient points on redeem, spec-vs-reality
   gaps, and a QR fallback when the camera isn't available.

Make the calls. If something in the spec is ambiguous, assume and say so.
```

I was kinda solid with the architecture given but upon reviewing I needed pushed back on two things, so I reprompted with:

```
Two things before I lock this:

1. You said expo-camera needs a dev build and won't run in Expo Go. That's wrong — expo-camera's barcode scanner (CameraView + onBarcodeScanned) is bundled in Expo Go and works there directly.
2. Scan as a top-level tab feels padded for an app this small. Make the case: bottom tab (Home / Rewards / Scan) vs. Scan as a button/action on Home with the camera as a modal. Pick one and justify.

Everything else — feature-folder structure, Axios + interceptors, Zustand for auth + TanStack Query for server state, CR query as single source of truth with invalidate-on-redeem, API-layer as the deep area, skip-tests/skip-design tradeoff — I'm accepting.

Output the final locked plan with those two resolved.
```

I wanted to it to build spine of the app first so I am completely satisfied with the arch. & moving further with final locked plan.

### ..
