import { transform } from '@babel/standalone'
import jsx from '@vue/babel-plugin-jsx'

export default {
  name: 'vue-jsx',
  transform(src: string) {
    return transform(src, {
      plugins: [jsx],
    }).code!
  },
}
