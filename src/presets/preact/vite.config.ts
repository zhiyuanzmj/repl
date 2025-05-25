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
              presets: [['typescript', { allExtensions: true, isTSX: true }]],
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
