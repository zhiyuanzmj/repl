import { transform } from '@babel/standalone'
import jsx from '@vue/babel-plugin-jsx'

export default {
  plugins: [
    {
      name: 'vite-plugin-vue-jsx',
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transform(code, {
            plugins: [jsx],
          }).code
      },
    },
  ],
}
