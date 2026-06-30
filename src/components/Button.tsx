import { motion, type HTMLMotionProps } from 'framer-motion';
import type { CSSProperties, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = PropsWithChildren<
    HTMLMotionProps<'button'> & {
        variant?: ButtonVariant;
        className?: string;
    }
>;

export function Button({
    variant = 'primary',
    className = '',
    children,
    type = 'button',
    style,
    ...props
}: ButtonProps) {
    const base =
        'min-h-12 rounded-3xl px-6 text-sm font-bold tracking-normal antialiased select-none focus:outline-none disabled:opacity-50';
    const styleByVariant =
        variant === 'primary'
            ? 'bg-[var(--app-accent)] text-white'
            : 'bg-[var(--app-card)] text-[var(--app-text)]';

    return (
        <motion.button
            type={type}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={`${base} ${styleByVariant} ${className}`}
            style={{ ...baseStyle, ...(variant === 'primary' ? primaryStyle : secondaryStyle), ...style }}
            {...props}
        >
            {children}
        </motion.button>
    );
}

export default Button;

const baseStyle: CSSProperties = {
    minHeight: 48,
    border: 0,
    borderRadius: 40,
    padding: '0 24px',
    font: 'inherit',
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    WebkitTapHighlightColor: 'transparent',
};

const primaryStyle: CSSProperties = {
    background: 'var(--app-accent)',
    color: '#fff',
    boxShadow: 'none',
};

const secondaryStyle: CSSProperties = {
    background: 'var(--app-card)',
    color: 'var(--app-text)',
    boxShadow: '0 1px 2px rgba(15,23,42,0.06), inset 0 0 0 1px var(--app-border)',
};
