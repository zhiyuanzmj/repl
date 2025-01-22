import {
  helperId,
  helperCode,
  transformVueJsxVapor,
} from 'unplugin-vue-jsx-vapor/api'

export default {
  name: 'unplugin-vue-jsx-vapor',
  resolveId(id: string) {
    if (id === helperId) return helperId
  },
  load(id: string) {
    if (id === helperId) return helperCode
  },
  transform: transformVueJsxVapor,
}
