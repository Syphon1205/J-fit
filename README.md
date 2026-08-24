# J-fit

J-fit is the Cunningham Fitness app: a cross-platform fitness, coaching, nutrition, progress, and trainer-sync experience built with Expo, React Native, Capacitor, and a native macOS trainer console. Note: Some TypeScript-related references and archived assets still remain within the repository as part of the migration to a native Swift implementation.

The app includes mobile and web screens for workouts, analytics, nutrition, readiness, run tracking, posture checks, trainer sync, settings, and profile management. It also includes a native macOS companion app for trainer-side athlete metric review.

## Tech Stack

- Expo SDK 54
- React Native and React Native Web
- Expo Router
- Zustand state stores
- Capacitor for native iOS integration
- EAS for production mobile builds
- Swift Package Manager for the native macOS trainer app

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm run start
```

Run a specific target:

```bash
npm run ios
npm run android
npm run web
```

Run TypeScript checks:

```bash
npm run typecheck
```

## Web Build

Build the web app:

```bash
npm run build:web
```

This exports the Expo web bundle and runs the web output patch script.

## Mobile Builds

Production builds use EAS:

```bash
npm run build:ios
npm run build:android
```

The app uses the bundle/package identifier:

```text
com.jfit.app
```

OAuth setup notes are in [OAUTH_SETUP.md](./OAUTH_SETUP.md).

## Capacitor iOS

Sync the web output into the iOS Capacitor project:

```bash
npm run cap:sync:ios
```

Open or run the Capacitor iOS app:

```bash
npm run cap:open:ios
npm run cap:run:ios
```

## Desktop Trainer App

Build the native macOS trainer console:

```bash
npm run desktop:build
```

Build and open it:

```bash
npm run desktop:run
```

Run it directly with Swift Package Manager:

```bash
npm run desktop:dev
```

More detail is available in [desktop/macos/CunninghamTrainer/README.md](./desktop/macos/CunninghamTrainer/README.md).

## Project Structure

```text
app/        Expo Router routes and platform-specific screens
src/        Components, stores, services, engines, utilities, and theme code
scripts/    Build and native patch scripts
desktop/    Native macOS trainer app
docs/       Architecture and product planning docs
assets/     App icons and image assets
```

## Documentation

- [OAuth setup](./OAUTH_SETUP.md)
- [Coach-first platform plan](./docs/COACH_FIRST_PLATFORM_PLAN.md)
- [Coaching ecosystem architecture](./docs/COACHING_ECOSYSTEM_ARCHITECTURE.md)
- [Cross-platform premium migration](./docs/CROSS_PLATFORM_PREMIUM_MIGRATION.md)
- [Next-gen platform system map](./docs/NEXT_GEN_PLATFORM_SYSTEM_MAP.md)
- [Vision adaptive architecture](./docs/VISION_ADAPTIVE_ARCHITECTURE.md)

## Notes

Local build outputs, native generated folders, Expo artifacts, environment files, and credential files are intentionally ignored by Git. Keep OAuth credentials, tokens, certificates, provisioning profiles, keystores, and local `.env` files out of the repository.
