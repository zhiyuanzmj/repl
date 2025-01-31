// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    JsxMacros(),
    {
      name: '@vue-macros/jsx-directive',
      transform(code, id) {
        return transformJsxDirective(code, id, { lib: 'vue', version: 3, prefix: 'v-' })
       }
    },
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
