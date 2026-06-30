# Cunningham Fitness: Bio-Adaptive Coaching Ecosystem

## 1. System Design Map

### Product Positioning Shift

Cunningham Fitness should move from a passive tracker to an active coaching operating system. The app should stop asking the user to interpret data and instead translate physiology, adherence, and context into the next best action.

### Core Architecture Layers

1. `Signal Layer`
   Collects raw inputs from device sensors, user check-ins, workout logs, nutrition logs, and coach-admin actions.

2. `Interpretation Layer`
   Normalizes noisy data into stable scores and trend objects such as readiness, momentum, recovery, adherence risk, and nutrition compliance.

3. `Decision Layer`
   Applies coaching rules to generate workout adaptations, environment swaps, UI tile priority, and coach alerts.

4. `Experience Layer`
   Renders dashboard priorities, workout adaptations, live session surfaces, haptic moments, and admin interventions.

5. `Persistence + Sync Layer`
   Stores the current plan, historical trends, adaptation events, and coach actions so the app can explain why it made a decision.

### Domain Modules

#### A. Bio-Readiness Logic Engine

Purpose:
Generate a `Daily Performance Capacity` score that decides whether the user should de-load, hold baseline, or push performance.

Inputs:
- Sleep duration
- Sleep efficiency / quality
- Resting heart rate trend
- HRV trend when available
- Subjective fatigue
- Soreness
- Motivation
- Previous 72-hour training load

Outputs:
- `performanceCapacityScore` from `0-100`
- Readiness band: `recovery`, `baseline`, `performance`
- Primary action: `deload`, `execute`, `push_pr`
- Recommended volume and intensity modifiers
- Human-readable rationale for trust and coach explainability

Placement:
- `src/modules/coaching/readinessEngine.ts`
- Fed by `healthStore`, `workoutStore`, and future daily check-in state

#### B. Infinite Environment State Manager

Purpose:
Allow the same programmed training day to survive equipment changes without changing the physiological outcome.

Inputs:
- Workout template
- Equipment profile: `commercial_gym`, `garage_gym`, `travel_bodyweight`
- Movement restrictions
- Available time

Core Model:
- `ExerciseIntent`: squat, hinge, horizontal push, vertical pull, unilateral knee flexion, anti-rotation, conditioning, etc.
- `StimulusProfile`: primary muscles, fatigue cost, stability demand, loading pattern, velocity intent
- `EnvironmentVariant`: exercise substitutions ranked by fidelity score

Outputs:
- Adapted exercise list
- Stimulus coverage report
- Swap confidence score
- Coach-visible downgrade warnings when no true equivalent exists

Placement:
- `src/modules/programming/exerciseOntology.ts`
- `src/modules/programming/environmentMapper.ts`

#### C. Professional OS Integration

Purpose:
Keep the active workout visible while the phone is locked so the app behaves like a real coaching tool during sets.

Core Surfaces:
- Lock Screen Live Activity
- Dynamic Island compact, minimal, and expanded states

Live Payload:
- Workout name
- Current exercise
- Set number
- Rep target
- Rest countdown
- Elapsed workout time
- Heart rate snapshot when available

Architecture:
- Expo UI remains the shell
- Native iOS module is required for ActivityKit support
- Workout session state becomes the source of truth
- Timer state broadcasts updates to both the app UI and Live Activity payload

Recommended boundaries:
- `src/modules/session/workoutSessionStore.ts` for canonical session state
- `ios/LiveActivities/` native target for ActivityKit and Dynamic Island rendering
- `src/modules/session/liveActivityBridge.ts` for JS-to-native message shaping

Implementation note:
Expo Notifications are useful for background alerts, but they are not a substitute for ActivityKit. This feature should be treated as a native capability with an Expo config plugin or a prebuild workflow.

#### D. Coach's Command Backend Logic

Purpose:
Detect users who are losing momentum before they churn.

Inputs:
- Scheduled sessions vs completed sessions
- RPE trend
- Missed check-ins
- Nutrition compliance trend
- Step and activity decline
- Readiness deterioration without corresponding deload acceptance

7-day Momentum Signals:
- Adherence rate
- Session completion ratio
- Average reported RPE delta from target
- Engagement decay
- Consecutive misses

Outputs:
- `momentumScore`
- `atRisk` boolean
- Severity tier: `watch`, `intervene`, `urgent`
- Admin alert payload with rationale and suggested intervention

Backend flow:
1. Nightly trend aggregation job computes rolling seven-day metrics.
2. Rule engine evaluates risk thresholds.
3. Alert record is stored for admin queueing.
4. Admin dashboard exposes recommended actions such as message, deload week, or schedule simplification.

#### E. Context-Aware Premium Dashboard

Purpose:
Make the home screen feel alive and useful, not decorative.

Context Inputs:
- Current time block
- Scheduled workout timing
- Readiness band
- Nutrition lag
- Hydration lag
- Recovery debt
- Active challenge status
- Workout currently in progress

Tile Priority Rules:
- If workout window is active, expand the workout tile first.
- If readiness is low, transform the workout tile into a recovery decision card.
- If protein is lagging late in the day, promote protein intake tile above general stats.
- If a workout is active, promote the live session tile and collapse less relevant cards.

Interaction Layer:
- Mesh gradients by state
- Haptic confirmation on tile expansion, swap acceptance, PR mode, and deload acceptance
- Motion tuned to confidence level: strong readiness yields sharper, faster transitions; recovery mode uses slower, calmer motion

### Event-Driven Data Flow

1. Health and app signals are collected.
2. Signals are normalized into daily physiology and behavior snapshots.
3. Engines generate derived scores: readiness, momentum, compliance, environment fit.
4. Decision rules emit recommendations and alerts.
5. Dashboard and workout session UI subscribe to those decisions.
6. User actions feed back into the system to improve future recommendations.

### Recommended Store / Service Split

Client-side stores:
- `healthStore`: raw health snapshots and permissions
- `workoutStore`: templates, logs, and active plan
- `nutritionStore`: goals and compliance
- `coachingStore`: derived coaching outputs only
- `sessionStore`: active workout execution state for timer and Live Activities

Pure services:
- `readinessEngine`
- `environmentMapper`
- `momentumEngine`
- `dashboardOrchestrator`

This keeps rules testable and avoids burying coaching logic inside UI components.

## 2. Bio-Readiness Logic Engine

### Objective

Produce a daily score that answers one question clearly:

`How much performance should the user try to express today?`

### Input Contract

Required:
- Sleep duration in hours
- Sleep quality score from `0-100`
- Resting heart rate baseline delta in bpm
- Subjective fatigue from `1-5`

Optional but strongly recommended:
- HRV baseline delta percentage
- Soreness from `1-5`
- Motivation from `1-5`
- Previous 72-hour training load from `0-100`

### Weighted Scoring Model

Suggested weights:
- Sleep quantity: `20%`
- Sleep quality: `20%`
- Heart rate recovery trend: `20%`
- HRV recovery trend: `15%`
- Subjective fatigue: `15%`
- Soreness: `5%`
- Motivation: `5%`

Why this mix:
- Sleep and autonomic recovery should anchor the score.
- Subjective fatigue remains important because athletes often feel degradation before wearable data catches it.
- Motivation should influence coaching tone, not dominate physiology.

### Scoring Principles

1. Penalize elevated resting heart rate more aggressively than you reward unusually low values.
2. Treat HRV as confidence-boosting if present, not mandatory.
3. Never let one perfect metric fully cancel three poor signals.
4. Convert outputs into action bands with explicit safeguards.

### Decision Bands

- `0-44`: Recovery mode
  Action: Offer automatic de-load.
  Training change: reduce volume `30-40%`, reduce intensity `5-10%`, remove top sets and PR prompts.

- `45-74`: Baseline mode
  Action: Run the scheduled session as written.
  Training change: keep normal volume and intensity.

- `75-100`: Performance mode
  Action: Suggest a high-performance day.
  Training change: allow PR attempt, add top set option, or progress load if warm-ups confirm readiness.

### Safety Overrides

Force recovery mode when any two of the following are true:
- Sleep under `5.5` hours
- Resting heart rate above baseline by `8+ bpm`
- HRV down more than `18%`
- Fatigue at `5/5`

Suppress PR mode when:
- Soreness is `4+`
- Previous 72-hour load is very high
- User missed nutrition targets materially the previous day

### Explainability Payload

Each score should include:
- Top positive contributor
- Top negative contributor
- Confidence level based on input completeness
- Recommendation copy ready for UI

### UX Response Examples

Low score:
`Recovery is under pressure today. Want me to convert Leg Day into a de-load session with lighter volume and longer rest?`

High score:
`You are primed today. Warm-ups permitting, this is a strong PR window for your lead lift.`

### Implementation Notes

- Run the engine once after morning health sync and again after subjective check-in completion.
- Persist both the score and the factor breakdown for coach explainability.
- The workout screen should consume the action object, not recompute readiness logic locally.
