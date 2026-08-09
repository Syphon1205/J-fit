# J Fit — Claude Handoff

## Current product state

J Fit is now a **native Swift-only iPhone app**. The previous TypeScript, React Native, Expo, Capacitor, and web implementation has been fully removed. The primary project is:

[`ios/App/App.xcodeproj`](./ios/App/App.xcodeproj)

The app bundle identifier is `com.jfit.app`. Installing it replaces the former J Fit app on an iPhone or Simulator Home Screen.

## Run the app

Open `ios/App/App.xcodeproj` in Xcode, select the **App** scheme, choose an iPhone or Simulator, and run.

Command-line example:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

The project does not require Node, CocoaPods, or any web bundle. It is a pure Swift and SwiftUI codebase targeting iOS, watchOS, and macOS.

## Product and UX direction

The app should feel quiet, compact, and distinctly Apple-native:

- Use SwiftUI and SF Pro through `.system(...)`; do not add a custom font.
- Prefer 28pt semibold screen titles, 18pt section titles, 16pt card titles, 15pt body text, and 13pt callouts.
- Avoid huge text and `.black` font weights except for a truly data-dense timer where contrast is needed.
- Use dark system surfaces, restrained sage/sky/clay accents, continuous corners, subtle borders, and light elevation.
- Do not copy Apple Fitness or Bevel layouts. The target is Apple-like clarity and hierarchy, not visual imitation.

Shared type tokens live in [`ios/App/App/Design/AppColors.swift`](./ios/App/App/Design/AppColors.swift) as `AppType`.

## Navigation

The root navigation is custom and lives in [`ios/App/App/Screens/ContentView.swift`](./ios/App/App/Screens/ContentView.swift).

- The system `UITabBar` is intentionally hidden. Do not re-enable it; it creates a second empty glass bar behind the custom navigation.
- At rest, show the single Liquid Glass dock for Home, Train, Fuel, Progress, and You, with the Coach bubble floating above it on the right.
- On an upward scroll gesture, the dock fades/contracts away; the Home bubble appears on the left and the one Coach bubble moves down to the right.
- On a downward scroll gesture, it returns to the full dock.
- Keep this as one stable view tree using opacity/offset. Do **not** change it back to conditional `if` branches with asymmetric `transition(...)` modifiers—doing so caused the prior “ghost dock” bug.

## Coach / Apple Intelligence

[`ios/App/App/Screens/DashboardView.swift`](./ios/App/App/Screens/DashboardView.swift) contains the on-device Coach.

- Uses Apple Foundation Models when `SystemLanguageModel.default` is available.
- Coach opens from the Home card or the floating Coach button.
- It must never fabricate an answer. If Apple Intelligence is unavailable, Health is disconnected, or generation fails, show an explicit unavailable/error state with no rules-based or synthetic fallback.
- Personalized guidance is only enabled when there is authorized, non-empty Apple Health data.

## Apple Health and truthful data

[`ios/App/App/Stores/HealthStore.swift`](./ios/App/App/Stores/HealthStore.swift) owns HealthKit.

- Home does not ask for Health permission automatically.
- Health permission is requested only from a clear user action.
- There are no fake fallback values for steps, calories, readiness, or coach answers.
- If data is missing or disconnected, render `—` or an explicit connection state.
- Recent Apple Health workouts are mapped into `HealthWorkoutRecord` and include activity, date, duration, and active calories when available.
- Health workout history feeds the Progress screen and weekly workout-minute totals.

## Progress

[`ios/App/App/Screens/ProgressView.swift`](./ios/App/App/Screens/ProgressView.swift) is the current Progress experience.

- Displays real Apple Health workout history after Health is connected.
- Has persisted local goals (`FitnessGoal`) and progress notes (`ProgressNote`).
- Users can create a goal, tap it to log its current value, delete it from the context menu, and write free-form notes.
- `ProgressStore` no longer starts with seeded weekly activity values. Its implementation is in [`ios/App/App/Stores/ProgressStore.swift`](./ios/App/App/Stores/ProgressStore.swift).

## Included native targets

- **App** — primary iPhone/iPad app
- **CunninghamWatch** — Watch companion, embedded in the App
- **FitnessWidgetExtension** — widget and Live Activity extension
- **CunninghamTrainer** — native macOS companion under `desktop/macos/CunninghamTrainer`

The watch and widget identifiers are namespaced under `com.jfit.app` in the Xcode project. The existing App Group remains `group.com.cunninghamfitness.app` to avoid introducing a new provisioning requirement; it is used for widget data sharing.

## Verification completed

- Native Xcode build succeeded after the current navigation fix.
- Full Swift source type-check passes.
- The app installs and launches in the iPhone 17 Pro simulator.
- The previously duplicated/ghost navigation capsule is removed in the expanded dock state.

## Important guardrails for future work

- Keep the native project tracked; `.gitignore` allows source in `ios/` while ignoring derived data, Pods, and user-specific Xcode state.
- Do not restore TypeScript, React Native, Expo, Capacitor, or web-bundle dependencies.
- Do not add demo health or AI values as fallbacks.
- Preserve the custom navigation’s single-overlay structure and hide the system tab bar.
- The project currently has substantial uncommitted migration work, including removal of the old Expo source and addition of the native iOS source. Review `git status` before committing.
