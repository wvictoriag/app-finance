/**
 * Conditional logger that only outputs to console in development mode.
 * In production, these methods can be extended to send logs to a monitoring service (e.g., Sentry).
 */
export const logger = {
    info: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.log('%c[INFO]', 'color: #3b82f6; font-weight: bold;', ...args);
        }
    },
    warn: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.warn('%c[WARN]', 'color: #f59e0b; font-weight: bold;', ...args);
        }
    },
    error: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.error('%c[ERROR]', 'color: #ef4444; font-weight: bold;', ...args);
        }
        // TODO: In production, send to an error tracking service
    },
    debug: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.debug('%c[DEBUG]', 'color: #8b5cf6; font-weight: bold;', ...args);
        }
    }
};
