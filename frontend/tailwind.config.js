/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'deep-blue': '#0a192f',
                'gold': '#ffd700',
                'light-gold': '#ffec8b',
            }
        },
    },
    plugins: [],
}
