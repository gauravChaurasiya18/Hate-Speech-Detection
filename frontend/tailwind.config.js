export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 32px rgba(34, 211, 238, 0.26)",
        violet: "0 0 36px rgba(167, 139, 250, 0.22)"
      }
    }
  }
};

