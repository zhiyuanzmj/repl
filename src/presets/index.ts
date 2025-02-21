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

export const importMapFile = 'import-map.json'
export const tsconfigFile = 'tsconfig.json'
export const viteConfigFile = 'vite.config.ts'
export const tsMacroConfigFile = 'tsm.config.ts'
export const indexHtmlFile = 'src/index.html'
export const appFile = 'src/App.tsx'
export const newFile = 'src/new.tsx'

export const defaultPresets = {
  'vue-jsx': {
    [indexHtmlFile]: { code: vueJsxHtml },
    [appFile]: { code: vueJsxAppCode },
    [newFile]: { code: vueJsxNewCode },
    [viteConfigFile]: { code: vueJsxViteConfCode },
    [tsMacroConfigFile]: { code: vueJsxTsmConfigCode },
    [tsconfigFile]: { code: vueJsxTsconfigCode },
    [importMapFile]: { code: vueJsxImportMap },
  },
  'vue-jsx-vapor': {
    [indexHtmlFile]: { code: vueJsxVaporHtml },
    [appFile]: { code: vueJsxVaporAppCode },
    [newFile]: { code: vueJsxVaporNewCode },
    [viteConfigFile]: { code: vueJsxVaporViteConfCode },
    [tsMacroConfigFile]: { code: vueJsxVaporTsmConfigCode },
    [tsconfigFile]: { code: vueJsxVaporTsconfigCode },
    [importMapFile]: { code: vueJsxVaporImportMap },
  },
  react: {
    [indexHtmlFile]: { code: reactHtml },
    [appFile]: { code: reactAppCode },
    [newFile]: { code: reactNewCode },
    [viteConfigFile]: { code: reactViteConfCode },
    [tsMacroConfigFile]: { code: reactTsmConfigCode },
    [tsconfigFile]: { code: reactTsconfigCode },
    [importMapFile]: { code: reactImportMap },
  },
  preact: {
    [indexHtmlFile]: { code: preactHtml },
    [appFile]: { code: preactAppCode },
    [newFile]: { code: preactNewCode },
    [viteConfigFile]: { code: preactViteConfCode },
    [tsMacroConfigFile]: { code: preactTsmConfigCode },
    [tsconfigFile]: { code: preactTsconfigCode },
    [importMapFile]: { code: preactImportMap },
  },
  solid: {
    [indexHtmlFile]: { code: solidHtml },
    [appFile]: { code: solidAppCode },
    [newFile]: { code: solidNewCode },
    [viteConfigFile]: { code: solidViteConfCode },
    [tsMacroConfigFile]: { code: solidTsmConfigCode },
    [tsconfigFile]: { code: solidTsconfigCode },
    [importMapFile]: { code: solidImportMap },
  },
}
