/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [
    // Using a function that returns the plugin to avoid top-level await
    require('@tailwindcss/forms')
  ],
}
