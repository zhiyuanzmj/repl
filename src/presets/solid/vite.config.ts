// @ts-nocheck
import transformJsxMacros from '@vue-macros/jsx-macros/api.js'
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from 'babel-preset-solid'

export default {
  plugins: [
    transformJsxMacros(),
    {
      name: '@vue-macros/jsx-directive',
      transform: transformJsxDirective,
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
