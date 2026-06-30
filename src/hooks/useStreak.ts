import { useWorkoutStore } from '../stores/workoutStore';

export function useStreak() {
    const { workoutLogs } = useWorkoutStore();

    // Get unique dates with completed workouts, sorted newest first
    const logDates = [...new Set(
        workoutLogs
            .filter((l) => l.completed)
            .map((l) => l.date)
    )].sort().reverse();

    // Count consecutive days ending at today or yesterday
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < logDates.length; i++) {
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];

        if (logDates[i] === expectedStr) {
            streak++;
        } else if (i === 0) {
            // Allow yesterday as the last workout day (streak still alive)
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (logDates[0] === yesterdayStr) {
                streak++;
                // Continue checking from yesterday
                for (let j = 1; j < logDates.length; j++) {
                    const exp2 = new Date(today);
                    exp2.setDate(today.getDate() - j - 1);
                    if (logDates[j] === exp2.toISOString().split('T')[0]) {
                        streak++;
                    } else break;
                }
            }
            break;
        } else {
            break;
        }
    }

    let longestStreak = 0;
    let currentRun = 0;
    const sortedAsc = [...logDates].sort();
    for (let i = 0; i < sortedAsc.length; i++) {
        if (i === 0) {
            currentRun = 1;
            longestStreak = 1;
            continue;
        }
        const prev = new Date(sortedAsc[i - 1]);
        const curr = new Date(sortedAsc[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            currentRun += 1;
        } else {
            currentRun = 1;
        }
        if (currentRun > longestStreak) longestStreak = currentRun;
    }

    return {
        streak,
        longestStreak,
        totalWorkouts: workoutLogs.length,
        lastWorkoutDate: logDates[0] ?? null,
    };
}
