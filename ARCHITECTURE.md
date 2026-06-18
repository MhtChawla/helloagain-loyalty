# Architecture

## TL;DR

Expo (managed, Expo Go). Feature-folder structure. Single typed Axios client
with interceptors. TanStack Query for server state, Zustand + SecureStore for
auth. Deep focus: API-layer resilience + points-balance sync. Consciously
skipped: broad test coverage and design polish.

## Stack

Expo (managed), run via Expo Go - `npx expo start`, zero build step for the
reviewer. `expo-camera` (`CameraView` + `onBarcodeScanned`) covers QR natively
in Expo Go, no dev build needed. TypeScript throughout.
Note: barcode scanning needs a physical device (Expo Go on a simulator has no
camera) - the manual code-entry fallback covers that case.

## Folder structure

```
src/
├── api/
│ ├── client.ts # axios instance, interceptors
│ ├── endpoints.ts # URL builders, CLIENT_ID baked in
│ └── types.ts # response types mirroring spec
├── features/
│ ├── auth/
│ │ ├── useLogin.ts
│ │ ├── authStore.ts # zustand: token, user, hydrate
│ │ └── LoginScreen.tsx
│ ├── loyalty/
│ │ ├── usePoints.ts # CR query (source of truth)
│ │ ├── useRewards.ts
│ │ ├── useRedeemCoupon.ts
│ │ ├── useRedeemReward.ts
│ │ ├── HomeScreen.tsx # points + profile + CTAs
│ │ └── RewardsScreen.tsx
│ └── scan/
│ └── ScanModal.tsx # expo-camera, modal-presented
├── components/
│ ├── Button.tsx
│ ├── Card.tsx
│ └── ErrorView.tsx
├── navigation/
│ └── RootNavigator.tsx # auth gate
├── lib/
│ ├── queryClient.ts
│ └── storage.ts # SecureStore wrapper
└── App.tsx
```

Feature-first, not layer-first. Hooks live next to the feature that owns them -
`features/loyalty/` tells the whole points domain in one folder.

## API layer

One Axios instance, two interceptors, hand-written types.

- baseURL `https://api.demo.helloagain.at`, default `Accept: application/json`.
- **Request interceptor** injects `Authorization: Token <token>`, reading
  `authStore.getState().token` imperatively (interceptors run outside React -
  no stale closures).
- **Response interceptor** normalizes errors → `{status, message}`; on 401,
  tears down the session (clear SecureStore + Zustand → auth gate drops to login).
- `endpoints.ts` owns the `CLIENT_ID` string and the param asymmetry (login
  takes `client_id` as query; everything else as path segment).
- Types hand-written from spec. **Use the `token` field, not `access_token`**
  (the response duplicates both). One runtime guard on the login response, since
  the German strings + field redundancy hint at an imperfectly predictable API.

## State management

| Concern                         | Tool                  |
| ------------------------------- | --------------------- |
| Token, user identity, hydration | Zustand + SecureStore |
| Points, profile, rewards        | TanStack Query        |

- Login success → token to SecureStore + Zustand. Cold start → hydrate from
  SecureStore before rendering the navigator (splash/null until hydrated, else
  the login screen flashes).
- **Balance = CR query (`usePoints`), single source of truth. Never store points
  in Zustand.** After redeem success → optimistic update from the returned
  `cr_points` (instant movement, rollback on failure), then invalidate `['cr']`
  and `['rewards']` to confirm and re-flip `is_redeemable`. Invalidate-only is
  the fallback if time runs short.

## Navigation & screens

```
RootNavigator (auth gate on authStore.token)
├── token == null → LoginScreen
└── token present → Native Stack:
├── HomeScreen (points + profile + "Scan to earn" + "View rewards")
├── RewardsScreen (bounty list, redeem buttons) ← pushed
└── ScanModal (camera + manual entry) ← presented modally
```

Auth gate is a conditional render on token presence, not imperative
`navigate()` - no flash, no back-to-login bug. Home is the hub; Rewards pushed;
Scan modal over everything, camera unmounts cleanly on dismiss.

## Deliberate tradeoffs

**Deep: API layer + state-sync resilience.** The spec hands you
redundant/inconsistent data on purpose - `token` vs `access_token`, `cr_points`
echoed in three places, German strings, a near-empty redeem response. Depth
means: single source of truth for balance, optimistic-then-invalidate with
rollback, 401 → auto-logout, centralized error normalization so every screen
renders failure identically, Query-flag-driven loading/error/empty states.

**Skipped, deliberately:**

- _Tests_ - one interceptor test to show approach; no suite. Prioritized
  state-sync correctness over coverage given the budget.
- _Design_ - system-default spacing, coherent palette, no animations/skeletons/
  theming abstraction.
- _Edge auth_ - no refresh rotation, no biometrics. Spec gives a static token;
  honor the scope.

The brief says decide where to spend time - data integrity under an inconsistent
spec is the highest-signal place; skipping speculative coverage and design
systems is the disciplined counterpart.

## Risks & edge cases

- **401 mid-session** - unknown TTL, no refresh endpoint. Interceptor clears
  session → login. Re-login is the only honest path.
- **Insufficient points** - disable redeem when `cr_points < needed_points`,
  and still handle server rejection gracefully (flags may be stale between
  refetches). Don't deduct on reward redeem until success confirms.
- **Spec vs reality** - shapes are examples; expect drift. Type defensively,
  validate login response at runtime, log raw responses in dev.
- **QR fallback** - manual code-entry inside the scan modal alongside the
  camera. Covers permission denial, simulator-with-no-camera, and a reviewer
  who'd rather type the given code. Non-negotiable.

## Build order

auth + API client → CR/points display → rewards list → scan/redeem modal last.
Depend-on-by-everything parts first, so a time-out still leaves a working,
demoable spine.
