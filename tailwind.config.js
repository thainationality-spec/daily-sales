export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand:   { 50:'#eef6ff',100:'#d9ecff',400:'#4f9cff',500:'#2b7fff',600:'#1465e6',700:'#0f4fb4' },
        mint:    '#10d9a3', grape:'#8b5cf6', sun:'#ffb020', rose:'#ff5c7a',
      },
      fontFamily: { thai: ['"LINE Seed Sans TH"','"Noto Sans Thai"','sans-serif'] },
      boxShadow: { pop:'0 10px 30px -10px rgba(20,101,230,.45)' },
    },
  },
  plugins: [],
}
