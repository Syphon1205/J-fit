# Cunningham Trainer

Native macOS trainer console for Cunningham Fitness.

## What It Does

- Browses for nearby Cunningham Fitness clients over native MultipeerConnectivity.
- Receives the mobile app's trainer metric payload.
- Shows health, sleep, run, weight, and training consistency metrics.
- Generates trainer-facing recommendations from the synced metrics.
- Uses Cunningham Fitness visual language without Electron, Tauri, or a web wrapper.

## Local Build

```bash
swift build
swift run CunninghamTrainer
```

## Standalone macOS App

From the repo root:

```bash
npm run desktop:build
```

That creates:

```text
desktop/macos/build/Cunningham Trainer.app
```

To build and open it:

```bash
npm run desktop:run
```

## Pairing Flow

1. Trainer opens the macOS app and presses `Find Client`.
2. Athlete opens Cunningham Fitness on iPhone, goes to `Profile > Trainer Sync`, and presses `Sync With Trainer`.
3. The trainer selects the nearby client.
4. The mobile app sends a local metric payload to the desktop app.

The current native proximity transport is Apple-first: iPhone app to macOS trainer app. Android support should use a matching native local-network or BLE transport with the same JSON payload contract.
