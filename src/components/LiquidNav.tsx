import { CSSProperties, useMemo } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { motion } from 'framer-motion';
import { BarChart3, Dumbbell, Home, UserRound } from 'lucide-react';

type LiquidTab = {
    label: string;
    route: string;
    icon: typeof Home;
};

const tabs: LiquidTab[] = [
    { label: 'Dashboard', route: '/', icon: Home },
    { label: 'Train', route: '/workouts', icon: Dumbbell },
    { label: 'Analytics', route: '/analytics', icon: BarChart3 },
    { label: 'Profile', route: '/profile', icon: UserRound },
];

const spring = { type: 'spring', stiffness: 300, damping: 25 } as const;

export function LiquidNav({
    active = 'Dashboard',
    contained = false,
}: {
    active?: 'Dashboard' | 'Train' | 'Analytics' | 'Profile';
    contained?: boolean;
}) {
    const activeLabel = useMemo(() => active.toLowerCase(), [active]);

    const go = async (tab: LiquidTab) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // Haptics are unavailable in desktop web previews.
        }
        window.location.assign(tab.route);
    };

    return (
        <nav style={contained ? styles.containedShell : styles.shell} aria-label="Primary">
            <div style={styles.dock}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const selected = tab.label.toLowerCase() === activeLabel;
                    return (
                        <button key={tab.label} type="button" style={styles.item} onClick={() => go(tab)}>
                            <span style={styles.iconWrap}>
                                <Icon size={22} color={selected ? '#CCFF00' : 'rgba(255,255,255,0.46)'} strokeWidth={2.25} />
                                {selected && (
                                    <motion.span
                                        layoutId="activeNavDot"
                                        transition={spring}
                                        style={styles.activeDot}
                                    />
                                )}
                            </span>
                            <span style={{ ...styles.label, color: selected ? '#CCFF00' : 'rgba(255,255,255,0.46)' }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

export default LiquidNav;

const styles: Record<string, CSSProperties> = {
    shell: {
        position: 'fixed',
        zIndex: 80,
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        pointerEvents: 'none',
    },
    containedShell: {
        position: 'relative',
        width: '100%',
        paddingBottom: 'env(safe-area-inset-bottom)',
        pointerEvents: 'none',
    },
    dock: {
        width: '92%',
        maxWidth: 520,
        margin: '0 auto 12px',
        minHeight: 76,
        borderRadius: 999,
        background: 'rgba(3,7,18,0.60)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.52), inset 0 0 0 1px rgba(255,255,255,0.05)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        alignItems: 'center',
        padding: '8px 10px',
        pointerEvents: 'auto',
    },
    item: {
        border: 0,
        background: 'transparent',
        color: '#fff',
        height: 58,
        borderRadius: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        font: 'inherit',
    },
    iconWrap: {
        position: 'relative',
        width: 30,
        height: 30,
        display: 'grid',
        placeItems: 'center',
    },
    activeDot: {
        position: 'absolute',
        left: '50%',
        bottom: -7,
        width: 7,
        height: 7,
        marginLeft: -3.5,
        borderRadius: 999,
        background: '#CCFF00',
        boxShadow: '0 0 18px rgba(204,255,0,0.82)',
    },
    label: {
        fontSize: 11,
        fontWeight: 760,
        letterSpacing: 0,
    },
};
