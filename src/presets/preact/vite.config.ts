import { transform } from '@babel/standalone'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    {
      name: 'vite-plugin-preact',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return (
            'import { h, Fragment } from "preact"\n' +
            transform(code, {
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
