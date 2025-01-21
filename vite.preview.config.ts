import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace'
import path from 'path/posix'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue/compiler-dom': '@vue/compiler-dom/dist/compiler-dom.cjs.js',
      '@vue/compiler-core': '@vue/compiler-core/dist/compiler-core.cjs.js',
      '@vue-macros/common': path.resolve(
        'node_modules',
        '@vue-macros/common/dist/index.cjs',
      ),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: [
        'index.html',
        'src/vue-jsx-vapor.ts',
        'src/volar-plugin-jsx-directive.ts',
        'src/volar-plugin-jsx-ref.ts',
        'src/vite-plugin-jsx-directive.ts',
      ],
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
