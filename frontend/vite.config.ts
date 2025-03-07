import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig((_) => {
  return {
    plugins: [tailwindcss(), solid()],
    // Enable logs and debugging for e2e testing
    logLevel: process.env.DEBUG ? 'info' : 'warn',
    resolve: {
      alias: {
        '~': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@pages': resolve(__dirname, './src/pages'),
        '@utils': resolve(__dirname, './src/utils'),
        '@api': resolve(__dirname, './src/api'),
        '~types': resolve(__dirname, './src/types'),
        '@test': resolve(__dirname, './test'),
        '@mocks': resolve(__dirname, './test/mocks')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
  }
})
