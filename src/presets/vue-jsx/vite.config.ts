import { transformSync } from '@babel/core'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    {
      name: 'vite-plugin-vue-jsx',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
            plugins: [jsx],
          }).code
      },
    },
  ],
}
