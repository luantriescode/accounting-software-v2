module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066ff',
        'primary-dark': '#0052cc',
        'primary-light': '#e8f0fe',
        success: '#00875a',
        'success-light': '#e3fcef',
        warning: '#ff8b00',
        danger: '#de350b',
        'danger-light': '#ffebe6',
        text: '#172b4d',
        'text-muted': '#6b778c',
        border: '#dfe1e6',
        card: '#ffffff',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(9,30,66,0.13), 0 0 0 1px rgba(9,30,66,0.08)',
        md: '0 3px 12px rgba(9,30,66,0.15)',
      },
    },
  },
  plugins: [],
}