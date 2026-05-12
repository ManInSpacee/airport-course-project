import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'forks',
    setupFiles: ['./src/tests/setup.ts'],
    server: {
      deps: {
        inline: [/prisma/, /@prisma/]
      }
    }
  }
})
