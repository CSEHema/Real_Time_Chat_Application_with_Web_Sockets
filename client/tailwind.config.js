/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "darkpurple" : "#1c1b22",
        "vibrantpurple" : "#7c66ff",
        "deepdark" : "#0f0e13",
        "lightdark" : "#25242b"
      },
    },
  },
  plugins: [],
}