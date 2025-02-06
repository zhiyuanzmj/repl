// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transformSync } from '@babel/core'
import { helperId, helperCode } from 'unplugin-vue-jsx-vapor/api.js'
import jsx from '@vue-jsx-vapor/babel'

export default {
  plugins: [
    jsxMacros({
      lib: 'vue/vapor',
    }),
    jsxDirective({
      lib: 'vue/vapor',
    }),
    {
      name: 'vite-plugin-vue-jsx-vapor',
      resolveId(id) {
        if (id === helperId) return helperId
      },
      load(id) {
        if (id === helperId) return helperCode
      },
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
            plugins: [jsx],
          }).code
      }
    },
  ],
}
