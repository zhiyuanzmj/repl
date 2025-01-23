import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'

export function debounce(fn: Function, n = 100) {
  let handle: any
  return (...args: any[]) => {
    if (handle) clearTimeout(handle)
    handle = setTimeout(() => {
      fn(...args)
    }, n)
  }
}

export function utoa(data: string): string {
  const buffer = strToU8(data)
  const zipped = zlibSync(buffer, { level: 9 })
  const binary = strFromU8(zipped, true)
  return btoa(binary)
}

export function atou(base64: string): string {
  const binary = atob(base64)

  // zlib header (x78), level 9 (xDA)
  if (binary.startsWith('\x78\xDA')) {
    const buffer = strToU8(binary, true)
    const unzipped = unzlibSync(buffer)
    return strFromU8(unzipped)
  }

  // old unicode hacks for backward compatibility
  // https://base64.guru/developers/javascript/examples/unicode-strings
  return decodeURIComponent(escape(binary))
}

import { computed, Ref, ref } from 'vue'
import { ImportMap } from './import-map'

export function useRouteQuery<T extends string | boolean>(
  name: string,
  defaultValue?: T,
  reload = false,
) {
  const searchParams = new URLSearchParams(location.search)
  const data = searchParams.get(name)
  const value = ref(data || defaultValue)
  return computed({
    get() {
      return value.value === 'true'
        ? true
        : value.value === 'false'
          ? false
          : value.value
    },
    set(v) {
      const searchParams = new URLSearchParams(location.search)
      if (v === defaultValue) {
        searchParams.delete(name)
      } else {
        searchParams.set(name + '', v as string)
      }
      const url = `${location.pathname}${searchParams.size ? '?' : ''}${searchParams.toString()}`
      if (reload) location.replace(url)
      else history.replaceState({}, '', url + location.hash)
      value.value = v
    },
  }) as unknown as Ref<T>
}

const esmRE = /(?<=from\s+['"])(?!http|\.|\/)[^'"]+(?=['"])/
export function addEsmPrefix(code: string, importMap: ImportMap) {
  const match = code.match(esmRE)
  if (match) {
    if (importMap?.imports?.[match[0]]) {
      code =
        code.slice(0, match.index) +
        importMap.imports[match[0]] +
        code.slice(match.index! + match[0].length)
    } else {
      code =
        code.slice(0, match.index) + 'https://esm.sh/' + code.slice(match.index)
    }
    return addEsmPrefix(code, importMap)
  }
  return code
}
