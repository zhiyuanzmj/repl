import { transformSync } from '@babel/core'
import { helperId, helperCode } from 'unplugin-vue-jsx-vapor/api'
import jsx from '@vue-jsx-vapor/babel'

export default {
  plugins: [
    {
      name: 'vite-plugin-vue-jsx-vapor',
      resolveId(id) {
        if (id === helperId) return helperId
      },
      load(id) {
        if (id === helperId) return helperCode
      },
      transform(code, id) {
        if (id.match(/\.[jt]sx$/))
          return transformSync(code, {
            plugins: [jsx],
          }).code
      },
    },
  ],
}
