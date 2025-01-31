// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from 'babel-preset-solid'

export default {
  plugins: [
    JsxMacros(),
    {
      name: '@vue-macros/jsx-directive',
      transform(code, id) {
        return transformJsxDirective(code, id, { lib: 'solid', version: 1.9, prefix: 'v-' })
       }
    },
    {
      name: 'vite-plugin-solid',
      transform(src, id) {
        if (id.match(/\.[jt]sx$/))
          return transform(src, {
            presets: [jsx],
          }).code
      },
    },
  ],
}
