// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transformSync } from '@babel/core'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    jsxMacros({
      lib: 'preact',
    }),
    jsxDirective({
      lib: 'preact',
    }),
    {
      name: 'vite-plugin-preact',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return (
            'import { h, Fragment } from "preact"\n' +
            transformSync(code, {
              plugins: [
                [
                  jsx,
                  {
                    pragma: 'h',
                    pragmaFrag: 'Fragment',
                  },
                ],
              ],
            }).code
          )
      },
    },
  ],
}
