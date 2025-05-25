import { transform } from '@babel/standalone'
import jsx from 'babel-preset-solid'

export default {
  plugins: [
    {
      name: 'vite-plugin-solid',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transform(code, {
            presets: [
              ['typescript', { allExtensions: true, isTSX: true }],
              jsx,
            ],
          }).code
      },
    },
  ],
}
