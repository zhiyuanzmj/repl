import vueJsxHtml from './vue-jsx/index.html?raw'
import vueJsxWelcomeCode from './vue-jsx/welcome.tsx?raw'
import vueJsxNewCode from './vue-jsx/new.tsx?raw'
import vueJsxViteConfCode from './vue-jsx/vite.config.ts?raw'

import vueJsxVaporHtml from './vue-jsx-vapor/index.html?raw'
import vueJsxVaporWelcomeCode from './vue-jsx-vapor/welcome.tsx?raw'
import vueJsxVaporNewCode from './vue-jsx-vapor/new.tsx?raw'
import vueJsxVaporViteConfCode from './vue-jsx-vapor/vite.config.ts?raw'

import reactHtml from './react/index.html?raw'
import reactWelcomeCode from './react/welcome.tsx?raw'
import reactNewCode from './react/new.tsx?raw'
import reactViteConfCode from './react/vite.config.ts?raw'

import solidHtml from './solid/index.html?raw'
import solidWelcomeCode from './solid/welcome.tsx?raw'
import solidNewCode from './solid/new.tsx?raw'
import solidViteConfCode from './solid/vite.config.ts?raw'

export const defaultPresets = {
  'vue-jsx': {
    indexHtml: vueJsxHtml,
    welcome: vueJsxWelcomeCode,
    new: vueJsxNewCode,
    viteConfig: vueJsxViteConfCode,
  },
  'vue-jsx-vapor': {
    indexHtml: vueJsxVaporHtml,
    welcome: vueJsxVaporWelcomeCode,
    new: vueJsxVaporNewCode,
    viteConfig: vueJsxVaporViteConfCode,
  },
  react: {
    indexHtml: reactHtml,
    welcome: reactWelcomeCode,
    new: reactNewCode,
    viteConfig: reactViteConfCode,
  },
  solid: {
    indexHtml: solidHtml,
    welcome: solidWelcomeCode,
    new: solidNewCode,
    viteConfig: solidViteConfCode,
  }
}
