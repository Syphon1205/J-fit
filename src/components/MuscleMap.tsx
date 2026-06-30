type FatigueProfile = {
    chest?: number;
    back?: number;
    shoulders?: number;
    biceps?: number;
    triceps?: number;
    core?: number;
    quads?: number;
    hamstrings?: number;
    glutes?: number;
    calves?: number;
};

type MuscleMapProps = {
    fatigueProfile: FatigueProfile;
    className?: string;
};

const clamp = (value?: number) => {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
};

const colorFor = (value?: number) => {
    const score = clamp(value);
    if (score <= 30) return '#CCFF00';
    if (score <= 70) return '#5B5B5B';
    return '#FF3333';
};

const glow = 'drop-shadow(0 0 8px currentColor)';

export default function MuscleMap({ fatigueProfile, className = '' }: MuscleMapProps) {
    return (
        <div className={`rounded-3xl bg-white/5 p-6 backdrop-blur-2xl ${className}`}>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Muscle Load Map</p>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div className="flex flex-col items-center gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Front</p>
                    <svg viewBox="0 0 220 420" className="h-72 w-full max-w-[220px]">
                        <g fill="none" stroke="#2A2A2A" strokeWidth="2">
                            <path d="M110 20c20 0 32 16 32 34 0 22-14 40-32 40s-32-18-32-40c0-18 12-34 32-34z" />
                            <path d="M70 110c-6 30-4 72 12 100 18 30 40 30 56 0 16-28 18-70 12-100" />
                            <path d="M84 210c-8 38-6 82 10 120 10 24 26 24 32 0 16-38 18-82 10-120" />
                        </g>
                        <g filter={glow}>
                            <path
                                d="M86 130c-10 28-8 58 6 82 10 16 26 16 36 0 14-24 16-54 6-82"
                                fill={colorFor(fatigueProfile.chest)}
                                opacity="0.85"
                            />
                            <path
                                d="M80 210c-8 26-6 56 4 84 8 20 22 20 30 0 10-28 12-58 4-84"
                                fill={colorFor(fatigueProfile.core)}
                                opacity="0.85"
                            />
                            <path
                                d="M52 160c-10 16-8 36 4 50 10 12 22 12 28 0 8-14 8-34-4-50"
                                fill={colorFor(fatigueProfile.shoulders)}
                                opacity="0.85"
                            />
                            <path
                                d="M140 160c-12 16-12 36-4 50 6 12 18 12 28 0 12-14 14-34 4-50"
                                fill={colorFor(fatigueProfile.shoulders)}
                                opacity="0.85"
                            />
                            <path
                                d="M60 220c-12 18-12 42 0 58 8 10 18 10 24 0 10-16 10-40 0-58"
                                fill={colorFor(fatigueProfile.biceps)}
                                opacity="0.85"
                            />
                            <path
                                d="M136 220c-10 18-10 42 0 58 8 10 18 10 24 0 12-16 12-40 0-58"
                                fill={colorFor(fatigueProfile.triceps)}
                                opacity="0.85"
                            />
                            <path
                                d="M78 300c-12 26-10 58 4 84 10 20 26 20 34 0 12-26 14-58 4-84"
                                fill={colorFor(fatigueProfile.quads)}
                                opacity="0.85"
                            />
                            <path
                                d="M110 300c-8 26-8 58 4 84 8 20 22 20 30 0 12-26 12-58 2-84"
                                fill={colorFor(fatigueProfile.quads)}
                                opacity="0.85"
                            />
                            <path
                                d="M86 380c-6 16-4 30 6 36 8 6 18 6 22 0 8-6 8-20 2-36"
                                fill={colorFor(fatigueProfile.calves)}
                                opacity="0.85"
                            />
                        </g>
                    </svg>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Back</p>
                    <svg viewBox="0 0 220 420" className="h-72 w-full max-w-[220px]">
                        <g fill="none" stroke="#2A2A2A" strokeWidth="2">
                            <path d="M110 18c18 0 32 16 32 34 0 22-14 40-32 40s-32-18-32-40c0-18 14-34 32-34z" />
                            <path d="M70 112c-6 30-4 72 12 100 18 30 40 30 56 0 16-28 18-70 12-100" />
                            <path d="M84 210c-8 38-6 82 10 120 10 24 26 24 32 0 16-38 18-82 10-120" />
                        </g>
                        <g filter={glow}>
                            <path
                                d="M82 118c-10 28-8 58 6 82 10 16 28 16 40 0 12-24 14-54 4-82"
                                fill={colorFor(fatigueProfile.back)}
                                opacity="0.85"
                            />
                            <path
                                d="M78 200c-8 30-6 60 10 84 10 16 24 16 34 0 16-24 18-54 8-84"
                                fill={colorFor(fatigueProfile.glutes)}
                                opacity="0.85"
                            />
                            <path
                                d="M66 240c-12 18-10 42 2 60 8 10 18 10 24 0 10-18 8-42-2-60"
                                fill={colorFor(fatigueProfile.hamstrings)}
                                opacity="0.85"
                            />
                            <path
                                d="M128 240c-10 18-10 42 2 60 8 10 18 10 24 0 12-18 12-42-2-60"
                                fill={colorFor(fatigueProfile.hamstrings)}
                                opacity="0.85"
                            />
                            <path
                                d="M52 150c-10 16-8 36 4 50 10 12 22 12 28 0 8-14 8-34-4-50"
                                fill={colorFor(fatigueProfile.shoulders)}
                                opacity="0.85"
                            />
                            <path
                                d="M140 150c-12 16-12 36-4 50 6 12 18 12 28 0 12-14 14-34 4-50"
                                fill={colorFor(fatigueProfile.shoulders)}
                                opacity="0.85"
                            />
                            <path
                                d="M84 300c-12 26-10 58 4 84 10 20 26 20 34 0 12-26 14-58 4-84"
                                fill={colorFor(fatigueProfile.calves)}
                                opacity="0.85"
                            />
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
}
