/**
 * Centralized application configuration.
 * Provides type-safe access to environment variables.
 */
export const config = {
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL as string,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    app: {
        name: 'Guapacha Finance',
        version: 'v2.1', // Incremented version for these improvements
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
    }
} as const;

// Validation (Fail early in development)
if (config.app.isDev) {
    if (!config.supabase.url) console.error('Missing VITE_SUPABASE_URL');
    if (!config.supabase.anonKey) console.error('Missing VITE_SUPABASE_ANON_KEY');
}
