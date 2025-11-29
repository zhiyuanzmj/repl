import { transformSync } from '@babel/core'
import jsx from 'babel-preset-solid'

export default {
  plugins: [
    {
      name: 'vite-plugin-solid',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
            presets: [
              ['typescript', { allExtensions: true, isTSX: true }],
              jsx,
            ],
            filename: id,
            sourceMaps: true,
          })
      },
    },
  ],
}
