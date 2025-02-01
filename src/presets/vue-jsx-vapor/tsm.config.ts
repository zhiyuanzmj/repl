// @ts-nocheck
import jsxDirective from '@vue-macros/volar/jsx-directive.js'
import jsxMacros from '@vue-macros/volar/jsx-macros.js'
import jsxRef from '@vue-macros/volar/jsx-ref.js'

export default {
  plugins: [
    jsxDirective(),
    jsxMacros({
      lib: 'vue/vapor',
    }),
    jsxRef(),
  ],
}
