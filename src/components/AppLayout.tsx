import type { ReactNode } from 'react';
import LiquidDock from './LiquidDock';

export function AppLayout({ children }: { children: ReactNode }) {
    return (
        <div
            className="h-[100dvh] w-full flex flex-col overflow-hidden"
            style={{
                height: '100dvh',
                width: '100%',
                background: 'var(--app-bg)',
                color: 'var(--app-text)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                WebkitFontSmoothing: 'antialiased',
                userSelect: 'none',
            }}
        >
            <style>{`
                [data-app-scroll-root] {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    overscroll-behavior-y: contain;
                    -webkit-overflow-scrolling: touch;
                }
                [data-app-scroll-root]::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <main
                data-app-scroll-root
                className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden pb-[100px]"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)',
                    paddingTop: 'env(safe-area-inset-top)',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {children}
            </main>

            <div
                className="absolute bottom-0 left-0 right-0 z-50"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                }}
            >
                <LiquidDock />
            </div>
        </div>
    );
}

export default AppLayout;
