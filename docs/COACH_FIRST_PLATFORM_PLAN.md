# Cunningham Fitness: Coach-First Platform Plan

## Architecture Plan

### Stack Reality

Current stack:
- React Native with Expo Router
- Zustand local stores
- Expo camera, auth-session, notifications
- iPhone-first testing on iOS

This means the product should be designed as a high-speed mobile coaching client with pure business engines in `src/modules` and thin UI/state wrappers above them.

## 1. Product Direction

The app should stop behaving like a collection of tools and start behaving like a coaching operating system.

The home experience should answer four questions immediately:
- What matters today?
- What should the athlete do next?
- What does the coach need to notice?
- What can be automated instead of manually interpreted?

## 2. Daily Briefing Dashboard

### Layout Schema

Use a high-contrast dark bento grid with one dominant focal tile and supporting tiles ranked by urgency.

Priority order:
1. `Daily Briefing Hero`
   Shows today’s session, readiness, overload suggestion, and one coaching directive.

2. `Recovery + Load`
   Shows readiness, cumulative fatigue, and the last progression event.

3. `Nutrition Brief`
   Only surfaces if protein, carbs, or hydration are materially off target.

4. `Momentum`
   Streak, adherence trend, and coach notes.

5. `Live Session`
   Expands automatically when a workout is active and becomes the launch point for the timer and Live Activity.

### UX Rules

- No dead tiles.
- Every card must either prompt action or explain a decision.
- Reduce visual clutter by replacing icon lists with one headline, one supporting metric, and one CTA.
- Preserve the dark bento aesthetic, but use stronger hierarchy: one large hero tile, two medium insight tiles, then a compact lower row.

## 3. Adaptive Intelligence

### Progressive Overload Engine

Purpose:
Convert actual performance and RPE into the next programming decision.

Inputs:
- Target reps
- Achieved reps
- Load used
- Target RPE
- Actual RPE
- Previous top set history
- Progression policy by lift

Outputs:
- Next load recommendation
- Volume recommendation
- Progression state: `increase`, `hold`, `reduce`, `deload`
- Human-readable reason for coach and athlete

### Logic summary

- If the athlete completes target reps below target RPE, progress load.
- If the athlete completes target reps at target RPE, hold or micro-progress.
- If the athlete misses reps or overshoots RPE, reduce or hold.
- If poor outcomes persist across multiple exposures, trigger a deload or exercise swap recommendation.

## 4. Coach’s View

### Data Stream Architecture

The coach should not inspect raw logs manually.

Pipeline:
1. Local client computes daily summaries.
2. Background sync sends compact adherence and fatigue summaries.
3. Admin view consumes only derived data streams.

Core coach stream objects:
- `adherenceSummary`
- `fatigueSummary`
- `readinessTrend`
- `nutritionComplianceSummary`
- `overloadState`

Coach-first alerts:
- Downward adherence over 7 days
- Persistent high-RPE stagnation
- Rising fatigue without training adaptation
- Missed check-ins after a previous strong streak

## 5. Live Activity Rest Timer

### Required architecture

Because Cunningham Fitness uses Expo, Live Activities need a native iOS bridge with ActivityKit.

Runtime model:
- `sessionStore` is the single source of truth for active set, rest time, rep target, and current exercise.
- JS updates the session store.
- A native bridge mirrors that state into ActivityKit.
- The Lock Screen and Dynamic Island render from that mirrored activity payload.

Payload fields:
- Workout name
- Current exercise
- Set number
- Target reps
- Rest countdown
- Elapsed session time

## 6. Compliance + Trust

### Account deletion

For App Store and privacy-law compliance, users need a clear self-serve account deletion flow inside the app.

Minimum behavior:
- Explicit destructive confirmation
- Immediate local deletion
- Removal of persisted user data
- Clear post-delete sign-out state

### Apple Sign In

Never silently fall back to a fake Apple account. If Apple auth is unavailable, the UI should state exactly why.

## 7. Camera / CV UX Direction

- Camera preview must have explicit ready, error, and active states.
- If preview fails, say so directly and offer a settings path.
- Analysis controls stay disabled until the camera is genuinely ready.
- Keep one fast primary action on screen: `Start Analysis`.
