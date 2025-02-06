import vueJsxHtml from './vue-jsx/index.html?raw'
import vueJsxAppCode from './vue-jsx/app.tsx?raw'
import vueJsxNewCode from './vue-jsx/new.tsx?raw'
import vueJsxViteConfCode from './vue-jsx/vite.config.ts?raw'
import vueJsxTsmConfigCode from './vue-jsx/tsm.config.ts?raw'
import vueJsxTsconfigCode from './vue-jsx/tsconfig.json?raw'
import vueJsxImportMap from './vue-jsx/import-map.json?raw'

import vueJsxVaporHtml from './vue-jsx-vapor/index.html?raw'
import vueJsxVaporAppCode from './vue-jsx-vapor/app.tsx?raw'
import vueJsxVaporNewCode from './vue-jsx-vapor/new.tsx?raw'
import vueJsxVaporViteConfCode from './vue-jsx-vapor/vite.config.ts?raw'
import vueJsxVaporTsmConfigCode from './vue-jsx-vapor/tsm.config.ts?raw'
import vueJsxVaporTsconfigCode from './vue-jsx-vapor/tsconfig.json?raw'
import vueJsxVaporImportMap from './vue-jsx-vapor/import-map.json?raw'

import reactHtml from './react/index.html?raw'
import reactAppCode from './react/app.tsx?raw'
import reactNewCode from './react/new.tsx?raw'
import reactViteConfCode from './react/vite.config.ts?raw'
import reactTsmConfigCode from './react/tsm.config.ts?raw'
import reactTsconfigCode from './react/tsconfig.json?raw'
import reactImportMap from './react/import-map.json?raw'

import preactHtml from './preact/index.html?raw'
import preactAppCode from './preact/app.tsx?raw'
import preactNewCode from './preact/new.tsx?raw'
import preactViteConfCode from './preact/vite.config.ts?raw'
import preactTsmConfigCode from './preact/tsm.config.ts?raw'
import preactTsconfigCode from './preact/tsconfig.json?raw'
import preactImportMap from './preact/import-map.json?raw'

import solidHtml from './solid/index.html?raw'
import solidAppCode from './solid/app.tsx?raw'
import solidNewCode from './solid/new.tsx?raw'
import solidTsmConfigCode from './solid/tsm.config.ts?raw'
import solidViteConfCode from './solid/vite.config.ts?raw'
import solidTsconfigCode from './solid/tsconfig.json?raw'
import solidImportMap from './solid/import-map.json?raw'

export const defaultPresets = {
  'vue-jsx': {
    indexHtml: vueJsxHtml,
    app: vueJsxAppCode,
    new: vueJsxNewCode,
    viteConfig: vueJsxViteConfCode,
    tsmConfig: vueJsxTsmConfigCode,
    tsconfig: vueJsxTsconfigCode,
    importMap: vueJsxImportMap,
  },
  'vue-jsx-vapor': {
    indexHtml: vueJsxVaporHtml,
    app: vueJsxVaporAppCode,
    new: vueJsxVaporNewCode,
    viteConfig: vueJsxVaporViteConfCode,
    tsmConfig: vueJsxVaporTsmConfigCode,
    tsconfig: vueJsxVaporTsconfigCode,
    importMap: vueJsxVaporImportMap,
  },
  react: {
    indexHtml: reactHtml,
    app: reactAppCode,
    new: reactNewCode,
    viteConfig: reactViteConfCode,
    tsmConfig: reactTsmConfigCode,
    tsconfig: reactTsconfigCode,
    importMap: reactImportMap,
  },
  preact: {
    indexHtml: preactHtml,
    app: preactAppCode,
    new: preactNewCode,
    viteConfig: preactViteConfCode,
    tsmConfig: preactTsmConfigCode,
    tsconfig: preactTsconfigCode,
    importMap: preactImportMap,
  },
  solid: {
    indexHtml: solidHtml,
    app: solidAppCode,
    new: solidNewCode,
    viteConfig: solidViteConfCode,
    tsmConfig: solidTsmConfigCode,
    tsconfig: solidTsconfigCode,
    importMap: solidImportMap,
  },
}
