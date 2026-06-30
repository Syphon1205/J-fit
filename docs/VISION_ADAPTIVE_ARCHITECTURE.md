# Cunningham Fitness: Vision-Adaptive Architecture

## System Architecture Map

### Product Objective

Turn workout video into on-device coaching. The system should capture a lift, extract pose and bar-path features in real time, compare them against lift-specific gold standards, and produce a single useful coaching cue without sending raw video to the cloud.

## 1. Core Runtime Layers

### A. Capture Layer

Responsibilities:
- Live camera preview and local video recording
- Frame scheduling
- ROI cropping around athlete and barbell region
- Device orientation, camera intrinsics, and lens metadata

Inputs:
- Camera frames from `expo-camera` now, native camera stack later for lower latency
- Lift selection: `squat`, `bench`, `deadlift`, `overhead_press`
- Viewpoint hint: `front`, `rear`, `left`, `right`

Outputs:
- `FramePacket` stream
- Optional recorded clip saved locally

### B. Edge Inference Layer

Responsibilities:
- Human pose detection
- Optional barbell / plate / wrist trajectory proxy detection
- Temporal smoothing and landmark confidence correction

Recommended model stack:
1. `Person / pose detector`
   Neural network type: lightweight single-person keypoint detector
   Best fit on mobile: MoveNet Lightning / Thunder, BlazePose GHUM, or a MobileNet-based heatmap regressor

2. `Temporal stabilizer`
   Neural network type: tiny temporal model or filter
   Best fit on device: 1D temporal convolution or One-Euro / Kalman filter

3. `Rep phase classifier`
   Neural network type: compact sequence classifier
   Best fit on device: temporal CNN or GRU over joint-angle sequences

4. `Bar path tracker`
   Neural network type: keypoint or object tracker
   Best fit on device: tiny detector plus optical-flow tracker, or wrist-midpoint proxy when bar is not visually reliable

Latency target for sub-5ms inference budget:
- Quantized INT8 / FP16 model
- NNAPI on Android, Core ML / Metal on iOS
- Fixed input resolution
- ROI crop around athlete
- Single-person assumption
- Landmark-only output, not full segmentation
- Skip-frame mode for detector, track landmarks in between
- Memory reuse and zero-copy frame pipelines

### C. Biomechanics Interpretation Layer

Responsibilities:
- Convert landmark coordinates into joint angles and movement features
- Normalize for camera distance, body size, and viewpoint
- Detect rep boundaries and concentric/eccentric phases
- Compare each rep against gold-standard kinematic templates

Outputs:
- Joint angle time series
- Symmetry metrics
- Bar path drift
- Bottom position and lockout events
- Rep feature vectors

### D. Form Score Layer

Responsibilities:
- Convert deviations into weighted penalties
- Produce rep-level score, session score, and critique objects
- Distinguish technical faults from tracking uncertainty

Outputs:
- `repScore`
- `sessionScore`
- `breakdownFlags`
- `repCritiques`

### E. Coaching Insights Layer

Responsibilities:
- Collapse noisy multi-metric analysis into one actionable cue
- Prioritize the fault with the highest coaching leverage
- Translate biomechanical language into athlete-friendly guidance

Output examples:
- `Chest up out of the hole`
- `Push knees out to keep them tracking`
- `Keep the bar closer to mid-foot`

### F. Overlay & UX State Layer

Responsibilities:
- Drive skeletal overlay, bar path trail, glow states, and status transitions
- Suppress noisy cues until confidence is high
- Handle the states: `ready`, `active_lift`, `complete`, `form_breakdown`

### G. Local-First Privacy Layer

Responsibilities:
- Keep raw video and intermediate landmarks on device
- Persist only local summaries unless the user explicitly saves the recording
- Never transmit frames, embeddings, or clips to the cloud

Persist locally:
- Lift metadata
- Rep scores
- Critiques
- Landmark-derived summaries
- User-approved recordings

Do not sync:
- Raw frames
- Full local pose sequences
- Any biometric video content

## 2. Gold Standard Template Design

Each lift should be represented as a template family, not a single rigid curve.

Template components:
- Acceptable joint angle corridors by phase
- Bar path corridor
- Tempo expectations
- Symmetry tolerance
- Viewpoint-specific observability rules

Lift-specific focus:

### Squat
- Hip depth relative to knee
- Knee tracking over foot
- Torso angle stability
- Lumbar neutrality
- Mid-foot vertical bar path

### Bench
- Forearm stacking near bottom
- Elbow flare control
- Wrist-bar alignment
- Bar touch and press path consistency
- Scapular stability proxies

### Deadlift
- Spine neutrality from setup through lockout
- Hip height and hinge pattern
- Bar proximity to shins and thighs
- Shoulder-bar relationship
- Early hip rise detection

### Overhead Press
- Rib flare / torso extension control
- Vertical stacked lockout
- Bar close to face path
- Elbow under wrist in drive phase
- Head-through timing

## 3. Real-Time Performance Strategy

### Frame pipeline
1. Camera frame arrives.
2. Run person detector every N frames.
3. Track ROI and landmarks between detector frames.
4. Smooth coordinates with a temporal filter.
5. Derive angles and state transitions.
6. Update overlay immediately.
7. Score rep after phase completion.

### Optimization tactics for sub-5ms model step
- Pre-warm model at session start
- Pin input size, e.g. `192x192` or `256x256`
- Crop tightly around subject
- Use batch size `1`
- Quantize and fuse ops
- Reuse tensors and buffers
- Run detector at lower cadence than overlay rendering
- Separate render FPS from inference FPS

## 4. Scoring Philosophy

The score should reward repeatable lift quality, not aesthetic perfection.

Recommended weighted categories:
- Joint alignment and angle adherence: `40%`
- Bar path and movement efficiency: `25%`
- Tempo and phase control: `15%`
- Stability / symmetry: `10%`
- Lockout and depth completion: `10%`

Important guardrails:
- Penalize dangerous faults more than cosmetic ones.
- Suppress harsh scoring when landmark confidence is low.
- Score each rep first, then aggregate the set.
- Surface one primary cue, one secondary cue max.

## 5. Overlay State Manager

### States
- `ready`
  Athlete in frame, confidence sufficient, waiting for motion threshold.

- `active_lift`
  Rep has started and overlay shows skeleton, path, and live status.

- `complete`
  Rep or set complete, show score card and cue summary.

- `form_breakdown`
  High-confidence technical fault or fatigue-driven drift detected.

### Transition rules
- `ready -> active_lift`
  Trigger when movement amplitude exceeds start threshold and landmark confidence is stable.

- `active_lift -> form_breakdown`
  Trigger when a major fault persists for a minimum frame count.

- `active_lift -> complete`
  Trigger when lockout or end-state is confirmed and motion decays below threshold.

- `form_breakdown -> active_lift`
  Trigger if the fault resolves within the same rep.

- `complete -> ready`
  Trigger after cue presentation timeout or next rep countdown.

## 6. Coaching Insights Generator

Cue generation priority:
1. Find the highest severity fault.
2. Filter to faults with high confidence and high coachability.
3. Collapse related biomechanical errors into one cue.
4. Phrase it as a movement intention, not a diagnosis.

Examples:
- Knee valgus + hip internal collapse -> `Spread the floor with your feet`
- Excessive forward torso loss in squat -> `Chest up out of the bottom`
- Deadlift bar drifting forward -> `Keep the bar tight to your legs`
- OHP lumbar extension -> `Brace ribs down before you press`

## 7. Local-First Edge-AI Privacy Rules

- Video is analyzed on device only.
- Cloud sync stores only compact score summaries and user-saved coaching notes.
- The default retention policy for temporary frame buffers is ephemeral in-memory only.
- Recorded clips require explicit user opt-in to save.
- All CV decisions should be reproducible from local landmark summaries, not remote services.
