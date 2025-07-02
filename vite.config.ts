import { defineConfig } from 'vite'
import replace from '@rollup/plugin-replace'
import { globby } from 'globby'
import Unocss from 'unocss/vite'
import vueJsxVapor from 'vue-jsx-vapor/vite'
import reactivityFunction from 'unplugin-vue-reactivity-function/vite'
import inspect from 'vite-plugin-inspect'
import AutoImport from 'unplugin-auto-import/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    reactivityFunction(),
    vueJsxVapor({
      macros: {
        defineExpose: {
          alias: ['defineExpose', 'defineExpose$'],
        },
        defineModel: {
          alias: ['defineModel', '$defineModel'],
        },
      },
      ref: {
        alias: ['useRef', '$useRef'],
      },
      interop: true,
    }),
    Unocss(),
    inspect(),
    AutoImport({
      imports: [
        'vue',
        { from: 'vue', imports: ['defineVaporComponent', 'defineComponent'] },
        { from: 'vue-jsx-vapor', imports: ['useRef'] },
      ],
    }),
    visualizer(),
  ],
  resolve: {
    alias: {
      path: 'path-browserify',
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
      treeshake: true,
    },
    lib: {
      entry: ['index.html', ...(await globby(['./proxy/*']))],
      fileName(_, name) {
        if (name === 'index.html') {
          return 'index.html'
        }
        return `proxy/${name}.js`
      },
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
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:3000',
        target: 'https://repl.zmjs.dev',
        changeOrigin: true,
      },
    },
  },
  envPrefix: 'NITRO_',
})
