// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import JsxDirective from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from 'babel-preset-solid'

export default {
  plugins: [
    JsxMacros(),
    JsxDirective(),
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
