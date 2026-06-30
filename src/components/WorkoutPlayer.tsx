import React, { CSSProperties, useMemo, useState } from 'react';
import { getWorkoutVideoSrc, resolveWorkoutVideo } from '../utils/VideoRegistry';

interface WorkoutPlayerProps {
    exerciseId: string;
    title?: string;
    style?: CSSProperties;
}

const TEAL = 'var(--app-secondary)';
const BLUE = 'var(--app-accent)';

export function WorkoutPlayer({ exerciseId, title, style }: WorkoutPlayerProps) {
    const [failed, setFailed] = useState(false);
    const video = useMemo(() => resolveWorkoutVideo(exerciseId), [exerciseId]);
    const src = useMemo(() => getWorkoutVideoSrc(exerciseId), [exerciseId]);

    if (!video || !src || failed) {
        return (
            <div style={{ ...styles.card, ...style }}>
                <div style={styles.badge}>Audio coaching only</div>
                <h3 style={styles.title}>{title ?? video?.title ?? 'Coached Movement'}</h3>
                <p style={styles.copy}>
                    {video?.coachCue ?? 'Local video is not available for this exercise yet. The coaching flow will continue with spoken cues and timing.'}
                </p>
                <div style={styles.waveRow}>
                    {[22, 38, 30, 52, 34, 46, 26, 40].map((height, index) => (
                        <span key={index} style={{ ...styles.wave, height }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...styles.playerCard, ...style }}>
            <video
                src={src}
                controls
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
                style={styles.video}
            />
            <div style={styles.playerMeta}>
                <div>
                    <div style={styles.badge}>{video.duration}</div>
                    <h3 style={styles.title}>{title ?? video.title}</h3>
                    <p style={styles.copy}>{video.coachCue}</p>
                </div>
            </div>
        </div>
    );
}

export default WorkoutPlayer;

const glass: CSSProperties = {
    background: 'var(--app-card)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
};

const styles: Record<string, CSSProperties> = {
    card: {
        minHeight: 260,
        borderRadius: 32,
        padding: 22,
        color: 'var(--app-text)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        ...glass,
    },
    playerCard: {
        borderRadius: 32,
        overflow: 'hidden',
        color: 'var(--app-text)',
        ...glass,
    },
    video: {
        width: '100%',
        aspectRatio: '16 / 9',
        display: 'block',
        objectFit: 'cover',
        background: 'var(--app-raised)',
    },
    playerMeta: {
        padding: 24,
    },
    badge: {
        width: 'fit-content',
        padding: '8px 12px',
        borderRadius: 999,
        background: '#ecfdf5',
        color: '#047857',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0,
    },
    title: {
        margin: '16px 0 8px',
        color: 'var(--app-text)',
        fontSize: 24,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: -1.1,
    },
    copy: {
        margin: 0,
        color: 'var(--app-muted)',
        fontSize: 15,
        lineHeight: 1.45,
        fontWeight: 650,
    },
    waveRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: 24,
    },
    wave: {
        width: 12,
        borderRadius: 999,
        background: `linear-gradient(180deg, ${BLUE}, ${TEAL})`,
    },
};
