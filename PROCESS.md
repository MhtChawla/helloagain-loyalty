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

### 5. Slice 4 — rewards list + reward redemption (Claude Code)

Prompt: useRewards (['rewards']) + useRedeemReward, RewardsScreen with FlatList,
affordability from CR query, invalidate-on-redeem (no optimism — empty response),
per-item pending, empty/loading/error states. (Prompt #5)

Built: bounties query, redeem mutation invalidating ['cr']+['rewards'],
FlatList w. ListEmptyComponent, affordability from usePoints (not echoed
cr_points), per-item pending via mutation.variables.

#### My review:

##### 5b. Bug (debugged manually) — reward redeem didn't update Home balance

Found during live testing. Symptom: redeem succeeded and the server
deducted (correct balance after a cold restart), but Home's points stayed stale
while the app was running.

Diagnosis: ran a restart test to isolate server vs client — correct-after-restart
ruled out the server, pointing at in-app cache. Traced it to two `QueryClient`
instances: the `QueryClientProvider` rendered one client while the redeem mutation
invalidated another, so `invalidateQueries` never reached the mounted ['cr'] query.

Fix: consolidated to a single shared client, with mutations reading it via
`useQueryClient()` instead of importing the singleton. Verified Home updates
without a restart. Standardized this before slice 5 so coupon redeem uses the
same pattern.

##### 5c. Slice 4 review fixes

- Per-item pending/error scoping: verified mutate() is called with the bare
  bounty id (not the { bounty_id } object), so `variables === item.id` resolves
  correctly and the spinner/error scope to the right row.
- Error typing: removed the `as unknown as ApiError` double-casts; typed the
  query/mutation error generic as ApiError so the normalized error flows through
  without casting. Cleaner across HomeScreen and RewardsScreen.

### 6. Slice 5 — scan modal + coupon redemption (Claude Code)

I gave prompt - `useRedeemCoupon` (writes returned cr_points then invalidates), ScanModal
with expo-camera + manual code-entry fallback, double-scan guard, permission
handling, wired to Home CTA. (Prompt #6)

Built: coupon mutation (setQueryData(['cr']) from server-confirmed cr_points,
then invalidate ['cr']+['rewards']), ScanModal with CameraView + onBarcodeScanned,
manual TextInput fallback, scan lock, permission-denied handling, modal presentation.

My review: generated 2 QR with one wrong & one right code(YFQY2D) then scanned each, for YFQY2D balance, & for wrong not but it still displayed the points added screen with undefined value. I've iterated this error `` & instead directed it to show error modal of invalid coupon code.

When camera `permission denied`, there was no catch so I reviewed & gave it another permission modal to allow. If still not camera, also manual fallback (typed YFQY2D — points added, no camera needed),
confirmed instant+reconciled balance, verified double-scan lock and graceful
already-redeemed error.

Also while testing, found it uses `SafeAreaView` from react-native, which is depreceated so replaced all imports from `react-native-safe-area-context`.

### 7. Single interceptor test (Claude Code)

I gave prompt for one jest-expo test on the Axios interceptors — token injection, error
normalization, 401-only teardown. Demonstrate approach, not a suite. (Prompt #7)

Built: `client.test.ts` covering header injection (token / no-token), ApiError
normalization, and clearAuth gated to 401 (not 400). Passing.
Deliberately scoped to one test — prioritized state-sync correctness over coverage
given the budget, per the architecture tradeoff.

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

**#4 - Slice 3**

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

**#5 - Slice 4**

```
Continuing the loyalty app. Build slice 4: rewards list + reward redemption. Follow ARCHITECTURE.md and API_SPEC.md.

src/features/loyalty/useRewards.ts — Query hook for the bounties endpoint, queryKey ['rewards'].
src/features/loyalty/useRedeemReward.ts — mutation POST to the reward-redeem endpoint with { bounty_id }. Important: the response returns only { bounty_id } — no cr_points, no balance. So do NOT optimistically deduct points (you'd be guessing the new balance). On success, invalidate ['cr'] and ['rewards'] — the refetch confirms the real balance and re-flips is_redeemable. Handle server-side rejection gracefully.
src/features/loyalty/RewardsScreen.tsx:

FlatList of bounties (not .map in a ScrollView). Each row is a Card: name, description, needed_points, and a redeem Button.
Affordability = the CR query (usePoints), the single source of truth — not the cr_points echoed inside each bounty. Disable redeem when !is_redeemable || crPoints < needed_points (belt and suspenders).
Per-item pending: only the reward currently being redeemed shows a spinner/disabled state; the others stay interactive (track via the mutation's variables).
Query-flag states: loading → spinner; error → ErrorView + retry; empty list → a clear "no rewards available" message (empty state matters now).
On successful redeem, give feedback (toast/inline) — the balance updates on its own via invalidation.


Wire Home's "View rewards" CTA to navigate here (the route exists now — remove that TODO).

Stop after this. Goal: Home → Rewards → see live bounties with correct affordability, redeem an affordable one, watch the balance refetch. Show me the files and confirm: (a) affordability reads from the CR query not the bounty's echoed field, and (b) the redeem invalidates rather than guessing the balance. Review before slice 5.
```

**#6 - Slice 5**

```
Final build slice of the loyalty app. Build slice 5: scan modal + coupon redemption. Follow ARCHITECTURE.md and API_SPEC.md.

src/features/loyalty/useRedeemCoupon.ts — mutation POST to the coupon-redeem endpoint with { code }. Unlike reward redeem, this response returns cr_points (the new balance). So on success: write that confirmed value into the cache with setQueryData(['cr'], ...) for an instant balance update, then invalidate ['cr'] and ['rewards'] to fully reconcile. (This is server-confirmed, not a guess — no rollback needed.)
src/features/scan/ScanModal.tsx:

expo-camera CameraView with onBarcodeScanned (QR), permission via useCameraPermissions — request on mount, handle denied gracefully.
On scan → call redeemCoupon(scannedData). Guard against double-scan (lock after first detection so it doesn't fire repeatedly while the QR is in frame).
Manual code-entry fallback inside the modal — a TextInput + submit, alongside the camera. Non-negotiable: covers permission denial, simulator-with-no-camera, and a reviewer who'd rather type the given code. Both paths call the same redeemCoupon.
On success → show points gained, then dismiss back to Home (balance already synced). On error → inline error, allow re-scan/retry. Camera unmounts cleanly on dismiss.


Wire Home's "Scan to earn" CTA to present this modal (remove the TODO). Present it as a modal route via the navigator.

Stop after this. Goal: Home → Scan → either scan a QR or type the code → points added → back on Home with updated balance. Show me the files and confirm: (a) the manual fallback works with no camera, (b) coupon redeem writes the returned cr_points then invalidates, (c) double-scan is guarded. Review before we wrap.
```

**#7 - Single interceptor test**

```
Add the single test for the loyalty app, per the testing tradeoff in ARCHITECTURE.md — one focused test that demonstrates approach, not a suite.

Set up Jest with the jest-expo preset if not already configured.
One test file for the Axios interceptors (src/api/client.test.ts). Cover the core of the API-layer resilience:

Request interceptor injects Authorization: Token <token> when authStore has a token, and omits the header when there's no token.
Response interceptor normalizes errors to the { status, message } ApiError shape.
A 401 triggers session teardown (clearAuth), and a non-401 error (e.g. 400) does not — confirming the teardown is correctly gated.

Mock authStore.getState() and Axios as needed. Keep it tight and readable — this is a demonstration of testing approach, not coverage. Run it and confirm it passes.
```
