import { ReadinessBand } from '../coaching/readinessEngine';
import { OverloadDecision } from '../coaching/overloadEngine';

export type DailyBriefingTileId =
    | 'session_hero'
    | 'recovery_load'
    | 'pre_workout_fuel'
    | 'nutrition_brief'
    | 'momentum'
    | 'live_session'
    | 'health_sync';

export interface DailyBriefingContext {
    minutesUntilWorkout?: number | null;
    readinessBand?: ReadinessBand | null;
    overloadDecision?: OverloadDecision | null;
    hasActiveSession: boolean;
    proteinDeficitGrams?: number;
    carbsDeficitGrams?: number;
    hydrationDeficitServings?: number;
    healthConnected: boolean;
    adherenceScore?: number | null;
}

export interface DailyBriefingTilePriority {
    id: DailyBriefingTileId;
    priority: number;
    headline: string;
}

export function prioritizeDailyBriefingTiles(
    context: DailyBriefingContext
): DailyBriefingTilePriority[] {
    const tiles: DailyBriefingTilePriority[] = [
        {
            id: context.hasActiveSession ? 'live_session' : 'session_hero',
            priority: context.hasActiveSession ? 100 : 80,
            headline: context.hasActiveSession ? 'Live session in progress' : 'Daily briefing',
        },
        {
            id: 'recovery_load',
            priority: context.readinessBand === 'recovery' ? 92 : 70,
            headline: context.readinessBand === 'recovery' ? 'Recovery needs attention' : 'Recovery and load',
        },
        {
            id: 'pre_workout_fuel',
            priority: context.minutesUntilWorkout != null && context.minutesUntilWorkout <= 60 ? 88 : 50,
            headline: 'Pre-workout fuel',
        },
        {
            id: 'nutrition_brief',
            priority:
                (context.proteinDeficitGrams ?? 0) > 25 || (context.carbsDeficitGrams ?? 0) > 35 || (context.hydrationDeficitServings ?? 0) > 2
                    ? 86
                    : 45,
            headline: 'Nutrition brief',
        },
        {
            id: 'momentum',
            priority: (context.adherenceScore ?? 100) < 70 ? 82 : 55,
            headline: 'Momentum',
        },
        {
            id: 'health_sync',
            priority: context.healthConnected ? 20 : 84,
            headline: context.healthConnected ? 'Health connected' : 'Connect health data',
        },
    ];

    return tiles.sort((a, b) => b.priority - a.priority);
}
