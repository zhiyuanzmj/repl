// @ts-nocheck
import { transformJsxDirective } from '@vue-macros/jsx-directive/api.js'
import {
  helperCode,
  helperId,
  transformVueJsxVapor,
} from 'unplugin-vue-jsx-vapor/api.js'

export default {
  plugins: [
    {
      name: '@vue-macros/jsx-directive',
      transform: transformJsxDirective,
    },
    {
      name: 'unplugin-vue-jsx-vapor',
      resolveId(id) {
        if (id === helperId) return helperId
      },
      load(id) {
        if (id === helperId) return helperCode
      },
      transform: transformVueJsxVapor,
    },
  ],
}
