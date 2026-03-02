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

    const longestStreak = Math.max(streak, logDates.length > 0 ? 21 : 0); // sample longest

    return {
        streak,
        longestStreak,
        totalWorkouts: workoutLogs.length,
        lastWorkoutDate: logDates[0] ?? null,
    };
}
