export type Equipment =
    | 'barbell'
    | 'dumbbell'
    | 'machine'
    | 'cable'
    | 'bodyweight'
    | 'kettlebell';

export type ExerciseProfile = {
    id: string;
    name: string;
    muscleGroup: 'chest' | 'back' | 'quads' | 'hamstrings' | 'shoulders' | 'arms' | 'core';
    equipment: Equipment;
    prescription: string;
    coachingCue: string;
};

export const exerciseCatalog: ExerciseProfile[] = [
    {
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        muscleGroup: 'chest',
        equipment: 'barbell',
        prescription: '4 sets · 6 reps · 82%',
        coachingCue: 'Pin the shoulder blades, touch low sternum, and drive the bar back over the shoulders.',
    },
    {
        id: 'dumbbell-bench-press',
        name: 'Dumbbell Bench Press',
        muscleGroup: 'chest',
        equipment: 'dumbbell',
        prescription: '4 sets · 8 reps · RPE 8',
        coachingCue: 'Let the dumbbells travel slightly wider, then finish with a smooth squeeze at the top.',
    },
    {
        id: 'machine-chest-press',
        name: 'Machine Chest Press',
        muscleGroup: 'chest',
        equipment: 'machine',
        prescription: '4 sets · 10 reps · controlled negative',
        coachingCue: 'Keep ribs down and use the handles to match your natural pressing path.',
    },
    {
        id: 'barbell-back-squat',
        name: 'Barbell Back Squat',
        muscleGroup: 'quads',
        equipment: 'barbell',
        prescription: '5 sets · 5 reps · 85%',
        coachingCue: 'Brace before the walkout, own the bottom, and push the floor away.',
    },
    {
        id: 'hack-squat',
        name: 'Hack Squat',
        muscleGroup: 'quads',
        equipment: 'machine',
        prescription: '4 sets · 8 reps · deep range',
        coachingCue: 'Keep the pelvis stacked and let the machine load the quads without rushing the bottom.',
    },
    {
        id: 'romanian-deadlift',
        name: 'Romanian Deadlift',
        muscleGroup: 'hamstrings',
        equipment: 'barbell',
        prescription: '4 sets · 8 reps · 3-second eccentric',
        coachingCue: 'Reach the hips back until the hamstrings bite, then stand tall without overextending.',
    },
    {
        id: 'dumbbell-rdl',
        name: 'Dumbbell Romanian Deadlift',
        muscleGroup: 'hamstrings',
        equipment: 'dumbbell',
        prescription: '4 sets · 10 reps · smooth tempo',
        coachingCue: 'Keep the dumbbells close and chase hamstring tension instead of floor depth.',
    },
    {
        id: 'lat-pulldown',
        name: 'Lat Pulldown',
        muscleGroup: 'back',
        equipment: 'cable',
        prescription: '4 sets · 10 reps · 1-second squeeze',
        coachingCue: 'Start each rep by pulling the elbows into your pockets, not by leaning back.',
    },
    {
        id: 'chest-supported-row',
        name: 'Chest-Supported Row',
        muscleGroup: 'back',
        equipment: 'machine',
        prescription: '5 sets · 8 reps · heavy but clean',
        coachingCue: 'Stay glued to the pad and pause with the shoulder blades fully retracted.',
    },
];

export function getExerciseById(currentId: string) {
    return exerciseCatalog.find((exercise) => exercise.id === currentId) ?? exerciseCatalog[0];
}

export function getAlternateExercise(currentId: string): ExerciseProfile {
    const current = getExerciseById(currentId);
    const options = exerciseCatalog.filter(
        (exercise) => exercise.muscleGroup === current.muscleGroup && exercise.equipment !== current.equipment
    );

    return options[0] ?? current;
}
