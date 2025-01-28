// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import JsxDirective from '@vue-macros/jsx-directive/api.js'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/api.js'

export default {
  plugins: [
    JsxMacros({
      lib: 'vue/vapor'
    }),
    JsxDirective({
      lib: 'vue/vapor'
    }),
    VueJsxVapor()
  ],
}
