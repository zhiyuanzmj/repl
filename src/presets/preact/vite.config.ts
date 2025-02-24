import { transformSync } from '@babel/core'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
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
