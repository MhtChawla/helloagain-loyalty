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
with (Prompt #1) in Prompts section.

I was kinda solid with the architecture given but upon reviewing I needed pushed back on two things, so I reprompted with:

```
Two things before I lock this:

1. You said expo-camera needs a dev build and won't run in Expo Go. That's wrong — expo-camera's barcode scanner (CameraView + onBarcodeScanned) is bundled in Expo Go and works there directly.
2. Scan as a top-level tab feels padded for an app this small. Make the case: bottom tab (Home / Rewards / Scan) vs. Scan as a button/action on Home with the camera as a modal. Pick one and justify.

Everything else — feature-folder structure, Axios + interceptors, Zustand for auth + TanStack Query for server state, CR query as single source of truth with invalidate-on-redeem, API-layer as the deep area, skip-tests/skip-design tradeoff — I'm accepting.

Output the final locked plan with those two resolved.
```

I wanted to it to build spine of the app first so I am completely satisfied with the arch. & moving further with final locked plan.

### 2. Slice 1 — API layer + auth (Claude Code)

##### using Sonnet 4.6

I gave prompt around: build API layer + auth only — client/interceptors, endpoints,
types, authStore, storage, useLogin. Stop before screens (Prompt #2)

It built: storage wrapper, typed responses, endpoints, Zustand authStore
(token/user separated — login returns no user, user loads slice 2),
Axios client w/ request+response interceptors, useLogin mutation.

My review:

1. verified if `clearAuth()` fire only on 401 not on every error.
2. it missed `hydrated` flag as reading token alone isn't enough as navigator needs to know when hydration finished, or it renders the login screen for a frame before the token load. I fixed hydrated to boolean & added to call to update it accordingly.
3. `setToken` was not presisted so I fixed it to SecureStore along with zustand.

Deferred queryClient setup to slice 2 (flagged by Claude Code as a prerequisite).

### 3. Slice 2 — query setup + login + navigation

Prompt: build queryClient, App.tsx provider + hydrate-on-mount, LoginScreen
via useLogin, RootNavigator auth gate. Stop before points/profile. (Prompt #3)

It built me: `queryClient` (retry 1 not default 3, refetchOnWindowFocus off — RN has
no window focus concept), `App.tsx` hydrates in useEffect and renders null until
isHydrated, RootNavigator three-state gate:
`(unhydrated → blank, hydrated+no token → Login, hydrated+token → Home)`,
LoginScreen w. ApiError-shaped errors + pending spinner, placeholder HomeScreen w. logout → clearAuth.

I verified the gate handles the hydration-flash case (blank until
SecureStore resolves) and that login sits outside the stack so there's no
back-to-login after auth.

Tested real credentials given in the spec against the live API —
token returns as specced, login works end-to-end.

### 4. Slice 3 — points + profile on Home (Claude Code)

Next I gave prompt to move further to link & develop: usePoints (CR, source of truth) + useProfile queries, Card/Button/ErrorView components, HomeScreen with Query-flag-driven states. (Prompt #4)

It built: two useQuery hooks `(['cr'], ['profile'])`, reusable components,
HomeScreen with combined loading → ErrorView (retry only the failed query) →
data layout. isLoading over isPending (v5: isLoading = isPending && isFetching).

My review: caught `Profile` type placed feature-local for no reason while other
response types are central — moved it to api/types.ts and verified it matches
the spec shape. Confirmed the response interceptor normalizes all errors so the
ApiError cast is safe. Tested live data + forced-error path (ErrorView + retry).

Updated flow:

```
Login -> Home screen visible - loader, then screen visible w points & profile with domey buttons (for next steps) & log out button.
ErrorView is in sync for fallbacks
```

### 5.

### ...

## Prompts used

**#1 Architeture (Opus)**

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

**#2 - Slice 1**

```
Context: building a React Native loyalty app. Read API_SPEC.md (the API contract — endpoints, request/response shapes, auth, client ID) and ARCHITECTURE.md (design decisions) in the repo root first. Follow both exactly.
Build slice 1 only: API layer + auth. Nothing else yet.

src/api/client.ts — Axios instance, baseURL + Accept: application/json, request interceptor injecting Authorization: Token <token> from authStore.getState().token, response interceptor normalizing errors to {status, message} and triggering logout on 401.
src/api/endpoints.ts — URL builders with CLIENT_ID baked in; login takes client_id as query param, rest as path segments. Use the exact paths from API_SPEC.md.
src/api/types.ts — hand-written types matching the exact JSON shapes in API_SPEC.md (LoginResponse, CustomerRelationship, Bounty, RedeemResponse). Use the token field; ignore access_token.
src/features/auth/authStore.ts — Zustand: token, user, hydrate-from-SecureStore.
src/lib/storage.ts — SecureStore wrapper.
src/features/auth/useLogin.ts — TanStack Query mutation; on success persist token + set store.

Stop after this slice. No screens or navigation yet. Show me the files and explain the interceptor + token-injection choices so I can review before we continue.
```

**#3 - Slice 2**

```
Continuing the loyalty app. Build slice 2: query setup + login screen + navigation with auth gate. Follow ARCHITECTURE.md.

src/lib/queryClient.ts — TanStack Query client (sane defaults: retry off or 1, no refetch-on-window-focus for RN).
App.tsx — wrap in QueryClientProvider; call authStore.hydrate() on mount; render null/splash until isHydrated is true so the login screen doesn't flash.
src/features/auth/LoginScreen.tsx — email + password inputs, submit via useLogin. Disable the button while the mutation is pending; show a normalized error inline on failure. System-default styling, clean and tidy (no design system).
src/navigation/RootNavigator.tsx — native stack. Auth gate: gate on isHydrated first, then conditional-render on authStore.token (null → LoginScreen; present → Home). No imperative navigate() for auth.
Minimal HomeScreen.tsx placeholder — just confirms you're logged in (e.g. "Logged in" + a logout button calling clearAuth). Real points/profile come in slice 3.

Stop after this. The goal: launch → (hydrate) → login → land on placeholder Home → logout returns to login. Show me the files and confirm the gate handles the hydration-flash case, so I can review before slice 3.
```

**#3 - Slice 3**

```
Continuing the loyalty app. Build slice 3: points + profile on Home. Follow ARCHITECTURE.md and API_SPEC.md.

src/features/loyalty/usePoints.ts — TanStack Query hook fetching the CR endpoint, queryKey ['cr']. This is the single source of truth for the points balance — return points plus whatever the screen needs.
src/features/loyalty/useProfile.ts — Query hook for the profile endpoint, queryKey ['profile'].
src/components/ — build Card.tsx, Button.tsx, ErrorView.tsx now (first needed here). System-default styling, clean and tidy, no theming abstraction. ErrorView takes a message + optional retry callback.
src/features/loyalty/HomeScreen.tsx — replace the placeholder. Show points balance prominently, then profile info (name, email, customer_id). Two CTAs: "Scan to earn" and "View rewards".

Drive loading / error / empty states from Query flags (isLoading, isError), not manual booleans. On error, render ErrorView with a retry that refetches. Combine the two queries' loading states sensibly.
Keep the logout button.


CTA handlers: Rewards and Scan screens don't exist yet (slices 4–5). Wire the buttons but leave handlers as clearly-marked TODO placeholders for now — don't navigate to routes that don't exist.

Stop after this. Goal: log in → land on Home showing live points + profile from the API, with proper loading/error states. Show me the files and confirm the Query-flag-driven states, so I can review before slice 4.
```
