<script setup lang="ts">
import Message from '../Message.vue'
import {
  type WatchStopHandle,
  inject,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'
import srcdoc from './srcdoc.html?raw'
import { PreviewProxy } from './PreviewProxy'
import { compileModulesForPreview } from './moduleCompiler'
import { injectKeyProps } from '../../src/types'

defineProps<{ show: boolean; ssr: boolean }>()

const { store, clearConsole, theme, previewTheme, previewOptions } =
  inject(injectKeyProps)!

const containerRef = useTemplateRef('container')
const runtimeError = ref<string>()
const runtimeWarning = ref<string>()

let sandbox: HTMLIFrameElement
let proxy: PreviewProxy
let stopUpdateWatcher: WatchStopHandle | undefined

// create sandbox on mount
onMounted(createSandbox)

// reset sandbox when import map changes
watch(
  () => store.value.getImportMap(),
  () => {
    try {
      createSandbox()
    } catch (e: any) {
      store.value.errors = [e as Error]
      return
    }
  },
)

function switchPreviewTheme() {
  if (!previewTheme.value) return

  const html = sandbox.contentDocument?.documentElement
  if (html) {
    html.className = theme.value
  } else {
    // re-create sandbox
    createSandbox()
  }
}

// reset theme
watch([theme, previewTheme], switchPreviewTheme)

onUnmounted(() => {
  proxy.destroy()
  stopUpdateWatcher && stopUpdateWatcher()
})

function createSandbox() {
  if (sandbox) {
    // clear prev sandbox
    proxy.destroy()
    stopUpdateWatcher && stopUpdateWatcher()
    containerRef.value?.removeChild(sandbox)
  }

  sandbox = document.createElement('iframe')
  sandbox.setAttribute(
    'sandbox',
    [
      'allow-forms',
      'allow-modals',
      'allow-pointer-lock',
      'allow-popups',
      'allow-same-origin',
      'allow-scripts',
      'allow-top-navigation-by-user-activation',
    ].join(' '),
  )

  const importMap = store.value.getImportMap()
  const sandboxSrc = srcdoc
    .replace(
      /<html>/,
      `<html class="${previewTheme.value ? theme.value : ''}">`,
    )
    .replace(/<!--IMPORT_MAP-->/, JSON.stringify(importMap))
    .replace(
      /<!-- PREVIEW-OPTIONS-HEAD-HTML -->/,
      previewOptions.value?.headHTML || '',
    )
    .replace(
      /<!--PREVIEW-OPTIONS-PLACEHOLDER-HTML-->/,
      previewOptions.value?.placeholderHTML || '',
    )
  sandbox.srcdoc = sandboxSrc
  containerRef.value?.appendChild(sandbox)

  proxy = new PreviewProxy(sandbox, {
    on_fetch_progress: (progress: any) => {
      // pending_imports = progress;
    },
    on_error: (event: any) => {
      const msg =
        event.value instanceof Error ? event.value.message : event.value
      if (
        msg.includes('Failed to resolve module specifier') ||
        msg.includes('Error resolving module specifier')
      ) {
        runtimeError.value =
          msg.replace(/\. Relative references must.*$/, '') +
          `.\nTip: edit the "Import Map" tab to specify import paths for dependencies.`
      } else {
        runtimeError.value = event.value
      }
    },
    on_unhandled_rejection: (event: any) => {
      let error = event.value
      if (typeof error === 'string') {
        error = { message: error }
      }
      runtimeError.value = 'Uncaught (in promise): ' + error.message
    },
    on_console: (log: any) => {
      if (log.duplicate) {
        return
      }
      if (log.level === 'error') {
        if (log.args[0] instanceof Error) {
          runtimeError.value = log.args[0].message
        } else {
          runtimeError.value = log.args[0]
        }
      } else if (log.level === 'warn') {
        if (log.args[0].toString().includes('[Vue warn]')) {
          runtimeWarning.value = log.args
            .join('')
            .replace(/\[Vue warn\]:/, '')
            .trim()
        }
      }
    },
    on_console_group: (action: any) => {
      // group_logs(action.label, false);
    },
    on_console_group_end: () => {
      // ungroup_logs();
    },
    on_console_group_collapsed: (action: any) => {
      // group_logs(action.label, true);
    },
  })

  sandbox.addEventListener('load', () => {
    proxy.handle_links()
    stopUpdateWatcher = watchEffect(updatePreview)
    switchPreviewTheme()
  })
}

async function updatePreview() {
  if (import.meta.env.PROD && clearConsole.value) {
    console.clear()
  }
  runtimeError.value = undefined
  runtimeWarning.value = undefined

  if (store.value.vueVersion) {
    const [major, minor, patch] = store.value.vueVersion
      .split('.')
      .map((v) => parseInt(v, 10))
    if (major === 3 && (minor < 2 || (minor === 2 && patch < 27))) {
      alert(
        `The selected version of Vue (${store.value.vueVersion}) does not support in-browser SSR.` +
          ` Rendering in client mode instead.`,
      )
    }
  }

  try {
    // compile code to simulated module system
    const modules = compileModulesForPreview(store.value)
    console.info(
      `[jsx-repl] successfully compiled ${modules.length} module${
        modules.length > 1 ? `s` : ``
      }.`,
    )

    const codeToEval = [
      `window.__modules__ = {};window.__css__ = [];` +
        `if (window.__app__) window.__app__.unmount();`,
      ...modules,
      `document.querySelectorAll('style[css]').forEach(el => el.remove())
        document.head.insertAdjacentHTML('beforeend', window.__css__.map(s => \`<style css>\${s}</style>\`).join('\\n'))`,
    ]

    // eval code in sandbox
    await proxy.eval(codeToEval)
  } catch (e: any) {
    console.error(e)
    runtimeError.value = (e as Error).message
  }
}

/**
 * Reload the preview iframe
 */
function reload() {
  sandbox.contentWindow?.location.reload()
}

defineExpose({ reload, container: containerRef })
</script>

<template>
  <div
    v-show="show"
    ref="container"
    class="iframe-container"
    :class="{ [theme]: previewTheme }"
  />
  <Message :err="(previewOptions?.showRuntimeError ?? true) && runtimeError" />
  <Message
    v-if="!runtimeError && (previewOptions?.showRuntimeWarning ?? true)"
    :warn="runtimeWarning"
  />
</template>

<style scoped>
.iframe-container,
.iframe-container :deep(iframe) {
  width: 100%;
  height: 100%;
  border: none;
  background-color: #fff;
}
.iframe-container.dark :deep(iframe) {
  background-color: #1e1e1e;
}
</style>
