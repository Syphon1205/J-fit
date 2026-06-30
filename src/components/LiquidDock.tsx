import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePathname, useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { BarChart2, Dumbbell, Home, User } from 'lucide-react';
import type { CSSProperties } from 'react';

const tabs = [
    { key: 'home', href: '/', icon: Home, label: 'Home' },
    { key: 'workouts', href: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { key: 'progress', href: '/progress', icon: BarChart2, label: 'Progress' },
    { key: 'profile', href: '/profile', icon: User, label: 'Health' },
] as const;

const isActive = (pathname: string, href: string): boolean => {
    if (href === '/') return pathname === '/' || pathname === '/index' || pathname === '/(tabs)';
    return pathname.startsWith(href) || pathname.includes(`/(tabs)${href}`);
};

export function LiquidDock() {
    const pathname = usePathname();
    const router = useRouter();

    const onPress = async (href: string) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // Haptics are unavailable in browser previews.
        }
        router.push(href as never);
    };

    return (
        <nav style={styles.nav}>
            <ul style={styles.list}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(pathname, tab.href);
                    return (
                        <li key={tab.key} style={styles.item}>
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                onClick={() => onPress(tab.href)}
                                style={styles.button}
                                aria-label={tab.label}
                            >
                                <span style={styles.iconSlot}>
                                    {active ? (
                                        <motion.span
                                            layoutId="navIndicator"
                                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                            style={styles.activePill}
                                        />
                                    ) : null}
                                    <Icon size={21} style={active ? styles.iconActive : styles.icon} />
                                </span>
                                <span style={active ? styles.labelActive : styles.label}>{tab.label}</span>
                            </motion.button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default LiquidDock;

const styles: Record<string, CSSProperties> = {
    nav: {
        width: '100%',
        padding: '10px 14px calc(env(safe-area-inset-bottom) + 8px)',
        background: 'var(--app-nav-bg)',
        borderTop: '1px solid var(--app-border)',
        boxShadow: 'var(--app-shadow)',
        boxSizing: 'border-box',
    },
    list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        alignItems: 'center',
        gap: 2,
        margin: 0,
        padding: 0,
        listStyle: 'none',
    },
    item: {
        minWidth: 0,
    },
    button: {
        width: '100%',
        height: 56,
        border: 0,
        borderRadius: 18,
        background: 'transparent',
        color: 'var(--app-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 0,
        font: 'inherit',
        WebkitTapHighlightColor: 'transparent',
    },
    iconSlot: {
        position: 'relative',
        width: 58,
        height: 30,
        display: 'grid',
        placeItems: 'center',
    },
    activePill: {
        position: 'absolute',
        inset: '0 2px',
        borderRadius: 999,
        background: 'var(--app-accent-soft)',
    },
    icon: {
        position: 'relative',
        color: 'var(--app-muted)',
    },
    iconActive: {
        position: 'relative',
        color: 'var(--app-accent)',
    },
    label: {
        color: 'var(--app-muted)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0,
        lineHeight: 1,
    },
    labelActive: {
        color: 'var(--app-accent)',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0,
        lineHeight: 1,
    },
};
