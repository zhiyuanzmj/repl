import { transformSync } from '@babel/core'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    {
      name: 'vite-plugin-preact',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
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
            filename: id,
            sourceMaps: true,
          })
      },
    },
  ],
}
