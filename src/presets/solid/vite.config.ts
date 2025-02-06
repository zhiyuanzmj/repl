// @ts-nocheck
import jsxMacros from '@vue-macros/jsx-macros/raw.js'
import jsxDirective from '@vue-macros/jsx-directive/raw.js'
import { transform } from '@babel/standalone'
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
      transform(src, id) {
        if (id.match(/\.[jt]sx$/))
          return transform(src, {
            presets: [jsx],
          }).code
      },
    },
  ],
}
