# HelloAgain Loyalty App

A React Native loyalty app built against the HelloAgain demo API: log in,
view your points balance and profile, browse rewards, scan a coupon QR (or type
the code) to earn points, and redeem rewards.

## Running it

1. `npm install`
2. `npx expo start`
3. Open in **Expo Go**: scan the terminal QR with the Expo Go app on a physical
   device, or press `i` / `a` for the iOS/Android simulator.
4. Log in with the provided test credentials.

No env setup — the base URL and client ID are baked into `src/api/`.

**Testing the coupon scan:** QR scanning needs a physical device (a simulator
has no camera).
Added 2 qr coupons to at `/coupons`

The scan modal includes a **manual code-entry field** — enter
the coupon code directly to test the redemption flow without a camera.

## Stack

Expo (Expo Go) · TypeScript · React Navigation (native stack) · TanStack Query ·
Zustand · Axios · expo-camera

## Features (vs spec)

- [x] Login (email/password → token, persisted in SecureStore)
- [x] Points balance from the customer relationship (CR)
- [x] Profile info
- [x] Rewards list from `/bounties/`
- [x] Coupon redemption to earn points (QR scan + manual entry)
- [x] Reward redemption for affordable bounties

## Approach & tradeoffs

I spent my time on **API-layer resilience and points-balance sync** — the area
the spec quietly tests (redundant `token`/`access_token`, `cr_points` echoed in
several places, a near-empty reward-redeem response, German strings). That meant:
a single typed Axios client with centralized error normalization, a 401 →
auto-logout interceptor, the CR query as the single source of truth for the
balance, and an honest sync strategy (refetch on focus + invalidate on redeem;
server-confirmed `cr_points` written straight to cache where the API returns it).

**Deliberately skipped:** broad test coverage (one focused interceptor test
demonstrates the approach — prioritized sync correctness over a suite given the
budget) and design-system polish (clean, system-default styling, no theming
abstraction). Full reasoning in [ARCHITECTURE.md](./ARCHITECTURE.md).

## AI collaboration

~80% of this was built with **Claude Code (Sonnet)**, with architecture planned
via **Claude Opus**. The split was deliberate: Opus for the upfront
architecture and tradeoff decisions, Claude Code on Sonnet for fast slice-by-slice
implementation. My role was the architecture direction, reviewing every slice,
catching and debugging issues (e.g. a stale-balance bug I isolated with a restart
test), and the integration decisions. Full slice-by-slice log, prompts, and review
notes in [PROCESS.md](./PROCESS.md).

## Tests

One focused test suite on the Axios interceptors (`src/api/client.test.ts`) —
the core of the API layer: token-header injection, error normalization to the
`ApiError` shape, and session teardown gated to 401 (not other error codes).
Scoped to a single meaningful test by design — see the testing tradeoff in
[ARCHITECTURE.md](./ARCHITECTURE.md).
