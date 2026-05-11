import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {              // ← add this
    host: '0.0.0.0',    // ← add this
    port: 5173          // ← add this
  }                     // ← add this
})