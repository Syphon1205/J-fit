type SpeechWindow = Window & typeof globalThis & {
    speechSynthesis?: SpeechSynthesis;
};

const getSpeechSynthesis = () => {
    if (typeof window === 'undefined') return null;
    const speechWindow = window as SpeechWindow;
    return speechWindow.speechSynthesis ?? null;
};

const sanitize = (value: string) => value.replace(/[\n\r]+/g, ' ').trim();

export function announceNextSet(userName: string, exercise: string, weight: number) {
    const synthesis = getSpeechSynthesis();
    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') return;

    const safeName = sanitize(userName || 'Athlete');
    const safeExercise = sanitize(exercise || 'the next set');
    const safeWeight = Number.isFinite(weight) ? Math.round(weight) : 0;
    const weightPhrase = safeWeight > 0 ? `${safeWeight} pounds` : 'your working load';

    const message = `Alright ${safeName}, rest is over. Let's hit 5 reps of ${safeExercise} at ${weightPhrase}.`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.pitch = 0.9;
    utterance.rate = 1.0;

    try {
        synthesis.cancel();
        synthesis.speak(utterance);
    } catch {
        // No-op: speech synthesis may be blocked or muted.
    }
}
