// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/raw.js'

export default {
  plugins: [
    jsxMacros({
      lib: 'vue/vapor',
    }),
    jsxDirective({
      lib: 'vue/vapor',
    }),
    VueJsxVapor(),
  ],
}
