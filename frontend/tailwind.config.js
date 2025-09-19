// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // This `content` array is the crucial part. It tells Tailwind to scan
  // your HTML file and all of your Vue and JavaScript files inside the `src`
  // directory for any utility classes you've used.
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
