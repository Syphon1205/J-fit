import { FormFault, SessionFormScore } from './formScoreCalculator';

const CUE_MAP: Record<FormFault['key'], string> = {
    knee_valgus: 'Push your knees out and keep them tracking over the foot.',
    spine_flexion: 'Chest up and brace harder to protect your spine position.',
    bar_path_drift: 'Keep the bar closer to a straight vertical path.',
    velocity_collapse: 'Stay tight through the sticking point and drive continuously.',
    depth_shortfall: 'Sit deeper with control before reversing the rep.',
    lockout_soft: 'Finish the rep fully and own the lockout.',
    rib_flare: 'Keep ribs down and brace before you press.',
    elbow_stack_loss: 'Stack elbow under wrist and press in line.',
};

export function generatePrimaryCoachingCue(score: SessionFormScore) {
    const topFault = score.repScores
        .flatMap((rep) => rep.faults)
        .sort((a, b) => b.penalty - a.penalty)[0];

    if (!topFault) {
        return 'Movement quality looks stable. Keep repeating that pattern.';
    }

    return CUE_MAP[topFault.key];
}
