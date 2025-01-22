import { addSrcPrefix, File, type Store } from './store'
import { type Transform, transform } from 'sucrase'

const REGEX_JS = /\.[jt]sx?$/
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

const resolveRE = /from\s+['"]([^'"]+)['"]/g

export async function compileFile(
  store: Store,
  { filename, code, compiled }: File,
): Promise<(string | Error)[]> {
  if (!code.trim()) {
    return []
  }

  if (filename.endsWith('.css')) {
    compiled.css = code
    return []
  }

  const noExt = !filename.includes('.')
  if (REGEX_JS.test(filename) || noExt) {
    const isJSX = testJsx(filename)
    if (testTs(filename) || noExt) {
      code = transformTS(code, isJSX)
    }

    const { plugins } = store.viteConfig
    // const jsxPlugin = store.isVapor
    //   ? await import('./vue-jsx-vapor').then((i) => i.default)
    //   : await import('./jsx').then(
    //       (i) => ({ transform: i.transformJSX }) as any,
    //     )
    for (const plugin of [...plugins]) {
      const result = plugin.transform?.(code, filename)
      code = typeof result === 'string' ? result : result?.code || code
      if (!plugin.resolveId) continue

      for (const match of code.matchAll(resolveRE)) {
        const [_, id] = match
        const resolvedId = plugin.resolveId(id)
        if (!resolvedId) continue

        code = code.replace(id, './' + resolvedId)
        const loaded = plugin.load?.(resolvedId)
        if (!loaded) continue

        const fileName = addSrcPrefix('unplugin-vue-jsx-vapor/helper.js')
        if (!store.files[fileName] || store.files[fileName].code !== loaded) {
          store.files[fileName] = new File(fileName, loaded, true)
          compileFile(store, store.files[fileName])
        }
      }
    }
    compiled.js = compiled.ssr = code
    return []
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
