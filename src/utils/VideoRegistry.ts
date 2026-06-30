export type ExerciseVideoTag =
    | 'pushup_form'
    | 'squat_mobility'
    | 'deadlift_hinge'
    | 'plank_brace'
    | 'hip_airplane'
    | 'shoulder_cars'
    | 'recovery_breathing';

export interface ExerciseVideoEntry {
    exerciseId: string;
    tag: ExerciseVideoTag;
    title: string;
    coachCue: string;
    duration: string;
}

export const workoutVideoRegistry: Record<string, ExerciseVideoEntry> = {
    pushups: {
        exerciseId: 'pushups',
        tag: 'pushup_form',
        title: 'Push-up Form Polish',
        coachCue: 'Brace hard, track elbows at 45 degrees, and own the bottom position.',
        duration: '08:24',
    },
    pushup: {
        exerciseId: 'pushup',
        tag: 'pushup_form',
        title: 'Push-up Form Polish',
        coachCue: 'Brace hard, track elbows at 45 degrees, and own the bottom position.',
        duration: '08:24',
    },
    squat: {
        exerciseId: 'squat',
        tag: 'squat_mobility',
        title: 'Squat Mobility Primer',
        coachCue: 'Open the hips, keep the ribcage stacked, and drive through the full foot.',
        duration: '11:10',
    },
    squats: {
        exerciseId: 'squats',
        tag: 'squat_mobility',
        title: 'Squat Mobility Primer',
        coachCue: 'Open the hips, keep the ribcage stacked, and drive through the full foot.',
        duration: '11:10',
    },
    deadlift: {
        exerciseId: 'deadlift',
        tag: 'deadlift_hinge',
        title: 'Deadlift Hinge Setup',
        coachCue: 'Load the hamstrings first, then push the floor away with a quiet spine.',
        duration: '09:42',
    },
    plank: {
        exerciseId: 'plank',
        tag: 'plank_brace',
        title: 'Plank Brace Mechanics',
        coachCue: 'Create tension from elbows to heels and breathe behind the brace.',
        duration: '06:35',
    },
    mobility: {
        exerciseId: 'mobility',
        tag: 'hip_airplane',
        title: 'Hip Airplane Control',
        coachCue: 'Move slowly through the hip while keeping the pelvis controlled.',
        duration: '07:18',
    },
    shoulders: {
        exerciseId: 'shoulders',
        tag: 'shoulder_cars',
        title: 'Shoulder CARs',
        coachCue: 'Reach long, rotate with intent, and avoid shrugging through the neck.',
        duration: '05:56',
    },
    recovery: {
        exerciseId: 'recovery',
        tag: 'recovery_breathing',
        title: 'Recovery Breathing Reset',
        coachCue: 'Slow nasal breathing to drop your nervous system after training.',
        duration: '04:44',
    },
};

export function resolveWorkoutVideo(exerciseId: string): ExerciseVideoEntry | null {
    const normalized = exerciseId.trim().toLowerCase().replace(/\s+/g, '-');
    return workoutVideoRegistry[normalized] ?? workoutVideoRegistry[normalized.replace(/-/g, '')] ?? null;
}

export function getWorkoutVideoSrc(exerciseId: string): string | null {
    const entry = resolveWorkoutVideo(exerciseId);
    return entry ? `./videos/${entry.tag}.mp4` : null;
}

export function getWorkoutVideoPoster(exerciseId: string): string | null {
    const entry = resolveWorkoutVideo(exerciseId);
    return entry ? `./videos/${entry.tag}.jpg` : null;
}
