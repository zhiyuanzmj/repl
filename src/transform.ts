import {
  type CompiledStack,
  File,
  type Store,
  type VitePlugin,
  addSrcPrefix,
} from './store'
import { type Transform, transform } from 'sucrase'
import postcss from 'postcss'
import postcssModules from 'postcss-modules'

const REGEX_JS = /\.[jt]sx?$/
const extRE = /\.[^.]+$/
function testTs(filename: string | undefined | null) {
  return !!(filename && /(\.|\b)tsx?$/.test(filename))
}
function testJsx(filename: string | undefined | null) {
  return !!(filename && /(\.|\b)[jt]sx$/.test(filename))
}

export function transformTS(src: string, isJSX?: boolean) {
  return transform(src, {
    transforms: ['typescript', ...(isJSX ? (['jsx'] as Transform[]) : [])],
    jsxRuntime: 'preserve',
    keepUnusedImports: true,
  }).code
}

const resolveRE = /(?:from|import)\s+['"]([^'"]+)['"]/g

export async function compileFile(
  store: Store,
  file: File,
): Promise<(string | Error)[]> {
  const { filename, code, compiled } = file
  if (!code.trim()) {
    return []
  }

  if (needProcessCssRE.test(filename)) {
    compiled.css = ''
    const result = await transformCssModules(code, filename)
    if (result) {
      compiled.css = result.css
      compiled.js = compiled.ssr = result.code
    }
    return []
  } else if (filename.endsWith('.css')) {
    compiled.css = code
    return []
  }

  if (REGEX_JS.test(filename) || !extRE.test(filename)) {
    file.compiledStack = []
    compiled.js = compiled.ssr = await transformVitePlugin(
      code,
      filename,
      store,
      file.compiledStack,
    )

    setTimeout(() => {
      compiled.css = ''
      for (const filename in store.files) {
        if (cssRE.test(filename) && compiled.js.includes(filename.slice(4))) {
          compiled.css += store.files[filename].compiled.css
        }
      }
      return []
    })
  }

  if (filename.endsWith('.json')) {
    let parsed
    try {
      parsed = JSON.parse(code)
    } catch (err: any) {
      console.error(`Error parsing ${filename}`, err.message)
      return [err.message]
    }
    compiled.js = compiled.ssr = `export default ${JSON.stringify(parsed)}`
    return []
  }

  return []
}

function resolvePlugins(plugins: (VitePlugin | undefined)[]): VitePlugin[] {
  const prePlugins: VitePlugin[] = []
  const postPlugins: VitePlugin[] = []
  const normalPlugins: VitePlugin[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (!p) return
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }
  const result = [...prePlugins, ...normalPlugins, ...postPlugins]

  const map = new Map()
  for (const [index, plugin] of result.entries()) {
    map.set(plugin.name || `plugin ${index}`, plugin)
  }
  return [...map.values()]
}

async function transformVitePlugin(
  code: string,
  id: string,
  store: Store,
  compiledStack: CompiledStack[] = [],
) {
  id = id.startsWith('/') ? id : `/${id}`
  let map
  const { plugins } = store.viteConfig
  for (const plugin of resolvePlugins(plugins)) {
    if (plugin.transformInclude) {
      if (!plugin.transformInclude(id)) continue
    }
    const result = await plugin.transform?.(code, id)
    if (typeof result === 'string') {
      code = result
    } else if (result) {
      code = result.code || code
      result.map && (map = result.map)
    }

    if (plugin.resolveId) {
      for (const match of code.matchAll(resolveRE)) {
        const [_, id] = match
        const resolvedId = plugin.resolveId(id)
        if (!resolvedId) continue

        function escapeRegExp(str: string) {
          return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }
        code = code.replaceAll(
          new RegExp(`(?<=['"])` + escapeRegExp(id), 'g'),
          (resolvedId.startsWith('/')
            ? '.'
            : resolvedId.startsWith('./')
              ? ''
              : './') + resolvedId,
        )
        let loaded = plugin.load?.(resolvedId)
        if (!loaded) continue
        loaded = await transformVitePlugin(loaded, resolvedId, store)

        const fileName = addSrcPrefix(resolvedId)
        if (!store.files[fileName] || store.files[fileName].code !== loaded) {
          store.files[fileName] = new File(fileName, loaded, true)
          await compileFile(store, store.files[fileName])
        }
      }
    }

    if ((compiledStack.at(-1)?.code || store.activeFile.code) !== code) {
      compiledStack.push({
        name: plugin.name || `plugin ${compiledStack.length}`,
        code,
        map,
        enforce: plugin.enforce,
      })
    }
  }

  if (testTs(id) || !extRE.test(id)) {
    code = transformTS(code, testJsx(id))
  }
  return code
}

export const sassRE = /\.scss$/
export const needProcessCssRE = /\.(module\.css|scss)$/
export const moduleCssRE = /module\.(scss|css)$/
export const cssRE = /\.(css|scss)$/
async function transformCssModules(code: string, id: string) {
  if (code.startsWith('export default')) return
  if (sassRE.test(id)) {
    // @ts-expect-error
    code = await import(/* @vite-ignore */ 'https://jspm.dev/sass').then(
      (i) => i.compileString(code).css,
    )
  }
  let resultJSON
  const plugins = []
  if (moduleCssRE.test(id)) {
    plugins.push(
      postcssModules({
        getJSON: (_, json) => {
          resultJSON = json
        },
      }),
    )
  }
  const { css } = await postcss(plugins).process(code)
  return {
    code: resultJSON ? `export default ${JSON.stringify(resultJSON)}` : '',
    css,
  }
}
