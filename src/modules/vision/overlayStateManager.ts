export type OverlayState = 'ready' | 'active_lift' | 'complete' | 'form_breakdown';

export interface OverlaySignalInput {
    landmarkConfidence: number;
    movementAmplitude: number;
    persistentMajorFaultFrames: number;
    repCompleted: boolean;
}

export function nextOverlayState(current: OverlayState, input: OverlaySignalInput): OverlayState {
    if (input.landmarkConfidence < 0.45) return 'ready';

    if (current === 'ready' && input.movementAmplitude >= 0.08) {
        return 'active_lift';
    }

    if (current === 'active_lift' && input.persistentMajorFaultFrames >= 4) {
        return 'form_breakdown';
    }

    if ((current === 'active_lift' || current === 'form_breakdown') && input.repCompleted) {
        return 'complete';
    }

    if (current === 'form_breakdown' && input.persistentMajorFaultFrames < 2) {
        return 'active_lift';
    }

    if (current === 'complete' && input.movementAmplitude < 0.03) {
        return 'ready';
    }

    return current;
}
