# Cunningham Fitness: Next-Gen Platform System Map

## Structural System Map

### Platform Goal

Rebuild Cunningham Fitness as a local-first coaching platform that interprets training stress, nutrition demand, movement quality, and behavioral decline in real time, then automates the next best coaching action.

### Primary Architecture Layers

1. `Capture Layer`
   Collects workouts, set-level load, nutrition logs, wearable data, subjective check-ins, video captures, and coach/admin actions.

2. `Local Operational Layer`
   Persists every event to an on-device event log before UI acknowledgement, computes derived state locally, and powers zero-latency decisions in dead-zone gyms.

3. `Adaptive Intelligence Layer`
   Runs deterministic domain engines:
   - `fatigueRecoveryMatrix`
   - `contextualNutritionEngine`
   - `readinessEngine`
   - `administrativeInsightsEngine`
   - `dashboardOrchestrator`

4. `Sync + Reconciliation Layer`
   Queues mutations, retries in the background, merges cloud acknowledgements, and preserves auditability for every coaching decision.

5. `Experience Layer`
   Delivers adaptive workout suggestions, nutrition goal shifts, coach alerts, and premium UI behavior.

### Bounded Modules

#### 1. Fatigue & Recovery Matrix

Purpose:
Track rolling 7-day volume load by muscle group and protect users from excessive localized fatigue.

Inputs:
- Set-level training logs
- Exercise-to-muscle distribution map
- Session intensity and RPE
- Completed and skipped sessions

Derived outputs:
- `7dVolumeByMuscleGroup`
- `cumulativeFatigueScore`
- `thresholdBreaches`
- `replacementRecommendation`

Primary rule:
If `chest` volume load exceeds threshold, suppress push-dominant programming and recommend `pull` or `legs`.

Implementation boundary:
- `src/modules/recovery/fatigueRecoveryMatrix.ts`

#### 2. Contextual Nutrition Sync

Purpose:
Translate workout intensity into time-bounded fueling changes, especially carbohydrate replenishment after demanding work.

Inputs:
- Workout intensity tier
- Duration
- Estimated glycogen cost
- Current macro goals
- Current time

Derived outputs:
- Dynamic 4-hour carb target
- Post-session fueling window
- Reason string for UI and coach visibility

Primary rule:
High-intensity or glycogen-taxing sessions should temporarily increase the carbohydrate goal for the next 4 hours.

Implementation boundary:
- `src/modules/nutrition/contextualNutritionEngine.ts`

#### 3. Vision-AI Form Analysis

Purpose:
Compare a user’s movement pattern against a gold-standard template using joint landmarks and angle sequences.

Data flow:
1. User records or uploads video.
2. On-device preprocessing segments reps and normalizes frame rate.
3. Pose estimator extracts landmarks: shoulders, elbows, hips, knees, ankles, spine proxy.
4. Angle engine computes per-frame joint angles, bar path proxy, tempo, and symmetry.
5. Comparator aligns the user’s movement cycle to the exercise’s gold-standard template.
6. Feedback engine scores deviations and emits coaching cues.
7. Only compact metadata and optional key frames sync to cloud unless full video retention is explicitly enabled.

Deployment model:
- On-device inference preferred for latency and privacy.
- Cloud inference allowed for heavy models or deferred coach review.

Key outputs:
- `formScore`
- `jointDeviationSummary`
- `repConsistencyScore`
- `topCorrectiveCues`

#### 4. Administrative Insights Engine

Purpose:
Give the owner a client-health dashboard that detects silent churn before cancellation happens.

Inputs:
- 14 to 28 day rolling activity trend
- Session adherence
- Workout intensity decline
- Nutrition logging frequency
- App open frequency
- Check-in response latency

Derived outputs:
- `clientHealthScore`
- `silentChurnRisk`
- `needsPersonalCheckIn`
- `recommendedOutreachType`

Primary rule:
Users with declining engagement and declining training execution, even without full drop-off, should be surfaced for personal intervention.

Implementation boundary:
- `src/modules/admin/administrativeInsightsEngine.ts`

#### 5. Universal Sync & State Management

Purpose:
Guarantee local responsiveness and durable sync in weak-connectivity training environments.

Core principles:
- Write locally first
- Sync asynchronously
- Never block UX on network
- Make every mutation idempotent
- Track conflict provenance explicitly

Data model:
- `eventLog`
- `materializedView`
- `syncQueue`
- `ackState`

Implementation boundary:
- `src/modules/sync/localFirstSync.ts`

## State Management Topology

### Local Stores

- `healthStore`
  Raw wearable and recovery signals.

- `workoutStore`
  Templates, active sessions, and logs.

- `nutritionStore`
  Daily goals, meal logs, water, and macro adjustments.

- `coachingStore`
  Derived adaptive decisions only.

- `syncStore`
  Queue, ack status, conflicts, retry metadata.

### Engine Invocation Flow

1. User action or device signal is persisted locally as an event.
2. Materialized view updates immediately.
3. Domain engine recomputes affected outputs.
4. UI reacts to derived decisions.
5. Sync worker transmits events in the background.
6. Cloud acknowledgements reconcile with local state without interrupting UX.

## Complex Logic Notes

### Fatigue logic

Volume load should be allocated proportionally by exercise stimulus, not naïvely assigned to a single muscle. Example: bench press contributes primarily to chest, secondarily to triceps and anterior delts.

### Nutrition logic

Post-session fueling should be time-bounded. Carb boosts should decay automatically after the replenishment window closes.

### Silent churn logic

The system should prioritize slope and behavior drift, not just hard inactivity. A client whose workout intensity, app opens, and logging frequency have all declined 20-30% over two weeks is often more important than a user who merely missed one day.

### Local-first logic

Every adaptive decision should be reproducible from the local event history. This is critical for trust, debugging, and coach explainability.

## Deployment Guidance

- Keep coaching engines pure and deterministic.
- Keep stores thin and event-driven.
- Use background sync workers for network transport only.
- Prefer storing compact derived summaries over re-running heavy calculations in UI components.
- Reserve cloud compute for fleet analytics, admin dashboards, and optional heavy AI inference.
