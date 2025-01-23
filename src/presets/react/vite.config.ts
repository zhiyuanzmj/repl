// @ts-nocheck
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    {
      name: '@vue-macros/jsx-directive',
      transform: transformJsxDirective,
    },
    {
      name: 'vite-plugin-react',
      transform(src, id) {
        if (id.match(/\.[jt]sx$/))
          return (
            'import React from "react"\n' +
            transform(src, {
              plugins: [jsx],
            }).code
          )
      },
    },
  ],
}
