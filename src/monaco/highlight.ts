import * as monaco from 'monaco-editor-core'
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs'
import { shikiToMonaco } from '@shikijs/monaco'

import langTS from 'shiki/langs/typescript.mjs'
import langJS from 'shiki/langs/javascript.mjs'
import langHtml from 'shiki/langs/html.mjs'
import langCSS from 'shiki/langs/css.mjs'
import themeDark from 'shiki/themes/dark-plus.mjs'
import themeLight from 'shiki/themes/light-plus.mjs'

let registered = false
export function registerHighlighter() {
  if (!registered) {
    const highlighter = createHighlighterCoreSync({
      themes: [themeDark, themeLight],
      langs: [langTS, langJS, langCSS, langHtml],
      engine: createJavaScriptRegexEngine(),
    })
    shikiToMonaco(highlighter, monaco)
    registered = true
  }

  return {
    light: themeLight.name!,
    dark: themeDark.name!,
  }
}
