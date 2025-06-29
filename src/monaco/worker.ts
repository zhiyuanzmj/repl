// @ts-expect-error
import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker'
import type * as monaco from 'monaco-editor-core'
import {
  type LanguageServiceEnvironment,
  type Mapping,
  createTypeScriptWorkerLanguageService,
} from '@volar/monaco/worker'
import { createNpmFileSystem } from '@volar/jsdelivr'
import { getLanguagePlugins } from '@ts-macro/language-plugin'
import { create as createTypeScriptServices } from 'volar-service-typescript'
import type { WorkerHost, WorkerMessage } from './env'
import { URI } from 'vscode-uri'
import { type Segment, type TsmVirtualCode, toString } from 'ts-macro'

const getVirtualCodePlugin = (
  name: string,
  index: number,
  enforce?: string,
) => ({
  name: 'virtual-code' + index,
  resolveVirtualCode({ codes, filePath }: TsmVirtualCode) {
    if (filePath.startsWith('/src')) {
      self.postMessage({
        filePath,
        code: toString(codes),
        map: buildMappings(codes).slice(1),
        prevName: name || `plugin ${index}`,
        enforce: enforce,
      })
    }
  },
})

function buildMappings<T>(chunks: Segment<T>[]) {
  let length = 0
  const mappings: Mapping<T>[] = []
  for (const segment of chunks) {
    if (typeof segment === 'string') {
      length += segment.length
    } else {
      mappings.push({
        sourceOffsets: [segment[2]],
        generatedOffsets: [length],
        lengths: [segment[0].length],
        data: segment[3]!,
      })
      length += segment[0].length
    }
  }
  return mappings
}

export interface CreateData {
  tsconfig: {
    compilerOptions?: import('typescript').CompilerOptions
  }
  tsMacroConfig: any
  dependencies: Record<string, string>
}

let ts: typeof import('typescript')
let locale: string | undefined
let tsMacroOptions: any

self.onmessage = async (msg: MessageEvent<WorkerMessage>) => {
  if (msg.data?.event === 'init') {
    try {
      tsMacroOptions = await import(
        /* @vite-ignore */ msg.data.tsMacroConfig
      ).then((i) => i.default)
    } catch (e) {
      tsMacroOptions = { plugins: [] }
      console.error(e)
    }
    locale = msg.data.tsLocale
    ts = await importTsFromCdn(msg.data.tsVersion)
    self.postMessage('inited')
    return
  }

  worker.initialize(
    (
      ctx: monaco.worker.IWorkerContext<WorkerHost>,
      { tsconfig, dependencies }: CreateData,
    ) => {
      const asFileName = (uri: URI) => uri.path
      const asUri = (fileName: string): URI => URI.file(fileName)
      const env: LanguageServiceEnvironment = {
        workspaceFolders: [URI.file('/')],
        locale,
        fs: createNpmFileSystem(
          (uri) => {
            if (uri.scheme === 'file') {
              if (uri.path === '/node_modules') {
                return ''
              } else if (uri.path.startsWith('/node_modules/')) {
                return uri.path.slice('/node_modules/'.length)
              }
            }
          },
          (pkgName) => dependencies[pkgName],
          (path, content) => {
            ctx.host.onFetchCdnFile(
              asUri('/node_modules/' + path).toString(),
              content,
            )
          },
        ),
      }

      const { options: compilerOptions } = ts.convertCompilerOptionsFromJson(
        tsconfig?.compilerOptions || {},
        '',
      )

      tsMacroOptions.plugins = tsMacroOptions.plugins
        .flatMap((plugin: any) => {
          if (typeof plugin === 'function') {
            return plugin({
              ts,
              compilerOptions,
            })
          } else {
            return plugin
          }
        })
        .flatMap((plugin: any, index: number) => [
          plugin,
          getVirtualCodePlugin(plugin.name, index, plugin.enforce),
        ])

      return createTypeScriptWorkerLanguageService({
        typescript: ts,
        compilerOptions,
        workerContext: ctx,
        env,
        uriConverter: {
          asFileName,
          asUri,
        },
        languagePlugins: getLanguagePlugins(
          ts,
          compilerOptions,
          tsMacroOptions,
        ),
        languageServicePlugins: createTypeScriptServices(ts),
      })
    },
  )
}

async function importTsFromCdn(tsVersion: string) {
  const _module = globalThis.module
  ;(globalThis as any).module = { exports: {} }
  const tsUrl = `https://cdn.jsdelivr.net/npm/typescript@${tsVersion}/lib/typescript.js`
  await import(/* @vite-ignore */ tsUrl)
  const ts = globalThis.module.exports
  globalThis.module = _module
  return ts as typeof import('typescript')
}
