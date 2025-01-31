// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/api.js'

export default {
  plugins: [
    JsxMacros({
      lib: 'vue/vapor'
    }),
    {
      name: '@vue-macros/jsx-directive',
      transform(code, id) {
       return transformJsxDirective(code, id, { lib: 'vue/vapor', version: 3, prefix: 'v-' })
      }
    },
    VueJsxVapor()
  ],
}
