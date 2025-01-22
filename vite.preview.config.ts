import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace'
import { globby } from 'globby'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue/compiler-dom': '@vue/compiler-dom/dist/compiler-dom.cjs.js',
      '@vue/compiler-core': '@vue/compiler-core/dist/compiler-core.cjs.js',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    rollupOptions: {
      external: ['node:worker_threads', 'unconfig'],
      plugins: [
        {
          name: 'remove unconfig',
          renderChunk(code) {
            return code.replaceAll(/import\s+["']unconfig["'];?\n?/g, '')
          },
        },
      ],
      treeshake: true,
    },
    lib: {
      entry: ['index.html', ...(await globby(['./src/proxy/*.ts']))],
      name: 'lib',
      formats: ['es'],
    },
    commonjsOptions: {
      ignore: ['typescript'],
    },
  },
  worker: {
    format: 'es',
    plugins: () => [
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      }),
    ],
  },
})
