import { addSrcPrefix, File, VitePlugin, type Store } from './store'
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
    keepUnusedImports: true
  }).code
}

const resolveRE = /(?:from|import)\s+['"]([^'"]+)['"]/g

export async function compileFile(
  store: Store,
  { filename, code, compiled }: File,
): Promise<(string | Error)[]> {
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
    compiled.js = compiled.ssr = await transformVitePlugin(
      code,
      filename,
      compiled,
      store,
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

function resolvePlugins(
  plugins: (VitePlugin| undefined)[],
): VitePlugin[] {
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
    map.set(plugin.name || `plugin-${index}`, plugin)
  }
  return [...map.values()]
}

async function transformVitePlugin(
  code: string,
  id: string,
  compiled: File['compiled'],
  store: Store,
) {
  if (testTs(id) || !extRE.test(id)) {
    code = await transformTS(code, testJsx(id))
  }

  const { plugins } = store.viteConfig
  for (const plugin of resolvePlugins(plugins)) {
    if (plugin.transformInclude) {
      if (!plugin.transformInclude(id)) continue
    }
    const result = await plugin.transform?.(code, id)
    code = typeof result === 'string' ? result : result?.code || code
    if (!plugin.resolveId) continue

    for (const match of code.matchAll(resolveRE)) {
      const [_, id] = match
      const resolvedId = plugin.resolveId(id)
      if (!resolvedId) continue

      code = code.replace(
        id,
        (resolvedId.startsWith('/') ? '.' : './') + resolvedId,
      )
      let loaded = plugin.load?.(resolvedId)
      if (!loaded) continue
      loaded = await transformVitePlugin(loaded, resolvedId, compiled, store)

      const fileName = addSrcPrefix(resolvedId)
      if (!store.files[fileName] || store.files[fileName].code !== loaded) {
        const pathName = fileName.split('?')[0]
        for (let key in store.files) {
          if (key.split('?')[0] === pathName) {
            setTimeout(() => delete store.files[key])
            break
          }
        }
        store.files[fileName] = new File(fileName, loaded, true)
        await compileFile(store, store.files[fileName])
      }
    }
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
    // @ts-ignore
    code = await import('https://jspm.dev/sass').then(
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
