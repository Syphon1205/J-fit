# J Fit

J Fit is a **native Swift-only iOS app** built with SwiftUI. It includes Apple Health integration, Apple Intelligence coaching, a WatchKit companion, and a Home Screen widget. All previous TypeScript, React Native, Expo, Capacitor, and web assets have been removed and are no longer available.

## Run on iPhone or Simulator

Open [the native Xcode project](./ios/App/App.xcodeproj), select the **App** scheme, then press Run. The app uses the `com.jfit.app` bundle identifier, so installing this build replaces the previous J Fit app on a device or Simulator Home Screen.

The iOS app is self-contained: it does not require Node, Expo, CocoaPods, or a web bundle.

## Included targets

- **App** — the primary iPhone/iPad SwiftUI app
- **CunninghamWatch** — watch companion
- **FitnessWidgetExtension** — Home Screen widget and Live Activity
- **CunninghamTrainer** — native macOS trainer companion in [`desktop/macos/CunninghamTrainer`](./desktop/macos/CunninghamTrainer)

## Local build

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```

The native app and its Apple-platform targets are kept in `ios/`; build artifacts and personal Xcode state remain ignored by Git.
