import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace'
// import { globby } from 'globby'
import Unocss from 'unocss/vite'

export default defineConfig({
  plugins: [vue(), Unocss()],
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
    outDir: './.vercel/output/static',
    rollupOptions: {
      external: ['node:worker_threads', 'unconfig', '@babel/core'],
      plugins: [
        {
          name: 'remove external',
          renderChunk(code) {
            return code.replaceAll(/import\s+["']unconfig["'];?\n?/g, '')
              // .replaceAll(`'@babel/core'`, `'https://esm.sh/@babel/core'`)
          },
        },
      ],
      treeshake: true
    },
    // lib: {
    //   entry: ['index.html', ...(await globby(['./proxy/*']))],
    //   fileName(_, name) {
    //     if (name === 'index.html') {
    //       return 'index.html'
    //     }
    //     return `proxy/${name}.js`
    //   },
    //   formats: ['es'],
    // },
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
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
  envPrefix: 'NITRO_',
})
