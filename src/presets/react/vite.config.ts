import { transform } from '@babel/standalone'
import jsx from '@babel/plugin-transform-react-jsx'

export default {
  plugins: [
    {
      name: 'vite-plugin-react',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return (
            'import React from "react"\n' +
            transform(code, {
              presets: [['typescript', { allExtensions: true, isTSX: true }]],
              plugins: [jsx],
            }).code
          )
      },
    },
  ],
}
