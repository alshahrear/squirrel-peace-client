import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,  // এই লাইনটা যোগ করতে হবে
    port: 5173,  // আপনার পোর্ট নাম্বার ঠিক থাকুক
  },
})