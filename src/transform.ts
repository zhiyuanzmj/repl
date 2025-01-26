import { addSrcPrefix, File, type Store } from './store'
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

function transformTS(src: string, isJSX?: boolean) {
  return transform(src, {
    transforms: ['typescript', ...(isJSX ? (['jsx'] as Transform[]) : [])],
    jsxRuntime: 'preserve',
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

    compiled.js = compiled.ssr = await transformVitePlugin(code, filename, compiled, store)

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

async function transformVitePlugin(code: string, id: string, compiled: File['compiled'], store: Store) {
  const { plugins } = store.viteConfig
  for (const plugin of plugins.flat()) {
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

      code = code.replace(id, (resolvedId.startsWith('/') ? '.' : './') + resolvedId)
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

  if (testTs(id) || !extRE.test(id)) {
    code = await transformTS(code, testJsx(id))
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
    code = await import('sass').then(i => i.compileString(code).css)
  }
  let resultJSON
  const plugins = []
  if (moduleCssRE.test(id)) {
    plugins.push(postcssModules({
      getJSON: (_, json) => {
        resultJSON = json
      }
    }))
  }
  const { css } = await postcss(plugins).process(code)
  return {
    code: resultJSON ? `export default ${JSON.stringify(resultJSON)}` : '',
    css
  }
}