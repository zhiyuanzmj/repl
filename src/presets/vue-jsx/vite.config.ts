// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transformSync } from '@babel/core'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    jsxMacros(),
    jsxDirective(),
    {
      name: 'vite-plugin-vue-jsx',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
            plugins: [jsx],
          }).code
      },
    },
  ],
}
