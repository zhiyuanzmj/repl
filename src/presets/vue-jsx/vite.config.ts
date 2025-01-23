// @ts-nocheck
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    {
      name: '@vue-macros/jsx-directive',
      transform: transformJsxDirective,
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
