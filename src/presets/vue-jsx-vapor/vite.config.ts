// @ts-nocheck
import transformJsxMacros from '@vue-macros/jsx-macros/api.js'
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import {
  helperCode,
  helperId,
  transformVueJsxVapor,
} from 'unplugin-vue-jsx-vapor/api.js'

export default {
  plugins: [
    transformJsxMacros({
      lib: 'vue/vapor'
    }),
    {
      name: '@vue-macros/jsx-directive',
      transform: transformJsxDirective,
    },
    {
      name: 'unplugin-vue-jsx-vapor',
      resolveId(id) {
        if (id === helperId) return helperId
      },
      load(id) {
        if (id === helperId) return helperCode
      },
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformVueJsxVapor(code, id)
      }
    },
  ],
}
