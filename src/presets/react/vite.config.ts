// @ts-nocheck
import JsxMacros from '@vue-macros/jsx-macros/api.js'
import JsxDirective from '@vue-macros/jsx-directive/api.js'
import { transform } from '@babel/standalone'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    JsxMacros({
      lib: 'react'
    }),
    JsxDirective(),
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
