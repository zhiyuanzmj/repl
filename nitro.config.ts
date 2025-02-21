export default defineNitroConfig({
  srcDir: 'server',
  preset: 'vercel_edge',
  experimental: {
    database: true,
  },
  compatibilityDate: '2025-02-19',
})
