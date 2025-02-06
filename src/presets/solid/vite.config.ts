// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transformSync } from '@babel/core'
import jsx from 'babel-preset-solid'

export default {
  plugins: [
    jsxMacros({
      lib: 'solid'
    }),
    jsxDirective({
      lib: 'solid'
    }),
    {
      name: 'vite-plugin-solid',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
            presets: [jsx],
          }).code
      },
    },
  ],
}
