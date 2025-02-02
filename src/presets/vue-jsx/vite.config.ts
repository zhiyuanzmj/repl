// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transform } from '@babel/standalone'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    jsxMacros(),
    jsxDirective(),
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
