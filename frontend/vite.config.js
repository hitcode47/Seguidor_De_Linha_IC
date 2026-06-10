import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base deve ser '/nome-do-repo/' para GitHub Pages (ex: '/SeguidorDeLinha/')
  // Mantém '/' para dev local — sobrescrito pela variável de ambiente no CI
  base: process.env.VITE_BASE_URL ?? '/',
  server: {
    port: 3000,
  },
})
