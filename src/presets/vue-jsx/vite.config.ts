// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import JsxDirective from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    JsxMacros(),
    JsxDirective(),
    {
      name: 'vite-plugin-vue-jsx',
      transform(src, id) {
        if (id.match(/\.[jt]sx$/))
          return transform(src, {
            plugins: [jsx],
          }).code
      },
    },
  ],
}
