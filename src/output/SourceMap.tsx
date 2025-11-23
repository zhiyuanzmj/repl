import type { SourceMapInput } from '@ampproject/remapping'
import { injectKeyProps } from '../types'

export default defineVaporComponent(() => {
  const { store } = $inject(injectKeyProps)!
  const { activeFile } = $(store)
  let src = $computed(() =>
    activeFile.compiledStack.at(-1)?.map
      ? toVisualizer(
          activeFile.compiled.js,
          activeFile.compiledStack.at(-1)?.map!,
        )
      : '',
  )
  return (
    <>
      <iframe v-if={src} h-full src={src}></iframe>
      <div v-else m-auto>
        None SourceMap
      </div>
    </>
  )
})

/*
 * Slightly modified version of https://github.com/AriPerkkio/vite-plugin-source-map-visualizer/blob/main/src/generate-link.ts
 */
function toVisualizer(code: string, sourceMap: SourceMapInput) {
  let map =
    typeof sourceMap === 'string' ? sourceMap : JSON.stringify(sourceMap)
  const encoder = new TextEncoder()

  // Convert the strings to Uint8Array
  const codeArray = encoder.encode(code)
  const mapArray = encoder.encode(map)

  // Create Uint8Array for the lengths
  const codeLengthArray = encoder.encode(codeArray.length.toString())
  const mapLengthArray = encoder.encode(mapArray.length.toString())

  // Combine the lengths and the data
  const combinedArray = new Uint8Array(
    codeLengthArray.length +
      1 +
      codeArray.length +
      mapLengthArray.length +
      1 +
      mapArray.length,
  )

  combinedArray.set(codeLengthArray)
  combinedArray.set([0], codeLengthArray.length)
  combinedArray.set(codeArray, codeLengthArray.length + 1)
  combinedArray.set(
    mapLengthArray,
    codeLengthArray.length + 1 + codeArray.length,
  )
  combinedArray.set(
    [0],
    codeLengthArray.length + 1 + codeArray.length + mapLengthArray.length,
  )
  combinedArray.set(
    mapArray,
    codeLengthArray.length + 1 + codeArray.length + mapLengthArray.length + 1,
  )

  // Convert the Uint8Array to a binary string
  let binary = ''
  const len = combinedArray.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(combinedArray[i])

  // Convert the binary string to a base64 string and return it
  return `https://evanw.github.io/source-map-visualization#${btoa(binary)}`
}
