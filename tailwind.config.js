/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                carbon: '#1a1a1a',
                slate: {
                    925: '#0a0f1c',
                    950: '#030712',
                },
                accent: {
                    primary: '#6366f1', // Indigo
                    secondary: '#3b82f6', // Blue
                }
            },
            boxShadow: {
                'things': '0 20px 40px -10px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.03)',
                'things-dark': '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.3)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
            }
        },
    },
    plugins: [],
}
