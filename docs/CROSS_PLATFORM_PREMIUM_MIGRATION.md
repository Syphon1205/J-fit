# Cunningham Fitness: Cross-Platform Premium Migration

## Direction

Do not rewrite the product away from React Native.

The correct architecture is:
- React Native + Expo Router for the shared product shell
- Expo prebuild / config plugins for native capability access
- Native iOS and Android modules only where premium OS behavior or ML performance requires them

This preserves:
- Shared product velocity
- Cross-platform UI consistency
- Web support where useful

And it unlocks:
- ActivityKit / Live Activities
- HealthKit / Health Connect
- Core ML / Vision and Android ML runtimes
- Lower-latency camera pipelines
- Native storage when AsyncStorage is no longer enough

## Architecture Boundary

### Keep shared in TypeScript
- Navigation
- Dashboard orchestration
- Coaching logic
- Session orchestration
- Sync queue semantics
- Program design and overload logic
- Admin data shaping

### Move native-sensitive features behind adapters
- Live Activities / Dynamic Island
- Health data ingestion
- Camera frame processors
- On-device pose estimation
- Haptics
- Plate calculator rendering helpers if native graphics are needed

## Migration Phases

### Phase 1
- Keep current Expo app shell
- Add persistent `sessionStore`
- Add derived `coachingStore`
- Add Daily Briefing priority engine
- Keep AsyncStorage for now

### Phase 2
- Move to Expo prebuild
- Add native bridges for ActivityKit, HealthKit, Core ML / Vision
- Replace basic camera flow with frame-processor pipeline

### Phase 3
- Add real local database backing
- Move session, sync, and analytics summaries into database-backed stores
- Add background sync workers and richer conflict reconciliation

## Key Rule

The premium feel will not come from abandoning cross-platform. It will come from having:
- a strong shared product layer
- clear native capability boundaries
- deterministic local-first coaching logic
