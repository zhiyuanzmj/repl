// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transformSync } from '@babel/core'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    jsxMacros({
      lib: 'react',
    }),
    jsxDirective({
      lib: 'react',
    }),
    {
      name: 'vite-plugin-react',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return (
            'import React from "react"\n' +
            transformSync(code, {
              plugins: [jsx],
            }).code
          )
      },
    },
  ],
}
