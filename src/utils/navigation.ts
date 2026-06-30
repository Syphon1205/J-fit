export type BackRouter = {
    back: () => void;
    replace: (href: any) => void;
    canGoBack?: () => boolean;
};

export function safeBack(router: BackRouter, fallback: string = '/') {
    try {
        if (typeof router.canGoBack === 'function') {
            if (router.canGoBack()) {
                router.back();
                return;
            }
            router.replace(fallback);
            return;
        }

        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
    } catch {
        // Fall through to the known route.
    }

    router.replace(fallback);
}
