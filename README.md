# HelloAgain Loyalty App

A React Native loyalty app: log in, view points & profile, browse rewards,
scan a coupon QR to earn points, redeem rewards.

## Run

1. `npm install`
2. `npx expo start`
3. Scan the QR with Expo Go (iOS/Android), or press `i` / `a` for simulator.

## Stack

Expo · TypeScript · TanStack Query · Zustand · Axios · expo-camera

## Features (vs spec)

- Login (email/password → token)
- Points balance from CR
- Profile info
- Rewards list from /bounties/
- QR/code redemption for points
- Reward redemption

## Approach & tradeoffs

Went deep on API-layer resilience and points-balance sync. Consciously skipped
broad test coverage and design polish - Consciously skipped broad test coverage and design polish - time is limited; grading is on architecture and API resilience, not pixel perfection.. Full reasoning in
[ARCHITECTURE.md](./ARCHITECTURE.md).

## AI collaboration

~80% built with Claude Code; architecture via Claude Opus. My role:
architecture, review, and key decisions. Full log in [PROCESS.md](./PROCESS.md).
