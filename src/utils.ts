import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'
// import { MagicString } from 'vue/compiler-sfc'
import MagicString from 'magic-string'

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

import type { ImportMap } from './store'

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

export function useRoutePath<T extends string | boolean>(
  defaultValue?: T,
  reload = false,
) {
  const data = location.pathname.slice(1)
  const value = ref(data || defaultValue)
  return computed({
    get() {
      return value.value
    },
    set(v) {
      let pathname = v === defaultValue ? '' : v
      const url = `/${pathname}${location.search}`
      if (reload) location.replace(url)
      else history.pushState({}, '', url + location.hash)
      value.value = v
    },
  }) as unknown as Ref<T>
}

const esmRE = /(?<=(?:from|import)\s+['"])(?!http|\.|\/)[^'"]+(?=['"])/g
export function addEsmPrefix(code: string, importMap?: ImportMap) {
  const s = new MagicString(code)
  const matches = code.matchAll(esmRE)
  for (let match of matches) {
    if (!importMap?.imports?.[match[0]]) {
      s.appendLeft(match.index, 'https://esm.sh/')
    }
  }
  return s.toString()
}
