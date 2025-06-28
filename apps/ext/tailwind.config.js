/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx"],
  theme: {
    extend: {
      aspectRatio: {
        '9/11': '9 / 11'
      }
    }
  },
  plugins: []
}