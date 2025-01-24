<script setup lang="ts">
import Preview from './Preview.vue'
import { computed, inject, useTemplateRef } from 'vue'
import {
  type EditorComponentType,
  type OutputModes,
  injectKeyProps,
} from '../types'
import SplitPane from '../SplitPane.vue'
import githubIcon from '../assets/svg/github.svg'

const props = defineProps<{
  editorComponent: EditorComponentType
  showCompileOutput?: boolean
  ssr: boolean
}>()

const { store } = inject(injectKeyProps)!
const previewRef = useTemplateRef('preview')
const modes = computed(() =>
  props.showCompileOutput ? (['js', 'css'] as const) : ([] as const),
)

const mode = computed<OutputModes>({
  get: () =>
    (modes.value as readonly string[]).includes(store.value.outputMode)
      ? store.value.outputMode
      : 'js',
  set(value) {
    if ((modes.value as readonly string[]).includes(store.value.outputMode)) {
      store.value.outputMode = value
    }
  },
})

function jumpToGithub() {
  open('https://github.com/zhiyuanzmj/repl')
}

function reload() {
  previewRef.value?.reload()
}

defineExpose({ reload, previewRef })
</script>

<template>
  <SplitPane layout="vertical">
    <template #left>
      <div class="flex-1 h-full">
        <div class="tab-buttons">
          <button class="active">
            <span>preview</span>
          </button>

          <div class="ml-auto flex items-center gap-2 pr-2">
            <select
              v-model="store.preset"
              class="ml-auto h-6 my-auto bg-black text-white rounded outline-none px-1"
            >
              <option v-for="(_, name) in store.presets" :key="name">
                {{ name }}
              </option>
            </select>

            <button @click="jumpToGithub">
              <img class="h7 mt-1" :src="githubIcon" />
            </button>
          </div>
        </div>
        <Preview ref="preview" show :ssr="ssr" />
      </div>
    </template>

    <template #right>
      <div class="flex h-full flex-1 flex-col overflow-hidden">
        <div class="tab-buttons">
          <button
            v-for="m of modes"
            :key="m"
            :class="{ active: mode === m }"
            @click="mode = m"
          >
            <span>{{ m }}</span>
          </button>
        </div>

        <props.editorComponent
          readonly
          :filename="store.activeFile.filename"
          :value="store.activeFile.compiled[mode]"
          :mode="mode"
        />
      </div>
    </template>
  </SplitPane>
</template>

<style scoped>
.tab-buttons {
  display: flex;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border);
  background-color: var(--bg);
  min-height: var(--header-height);
  overflow: hidden;
}
.tab-buttons button {
  padding: 0;
  box-sizing: border-box;
}
.tab-buttons span {
  font-size: 13px;
  font-family: var(--font-code);
  text-transform: uppercase;
  color: var(--text-light);
  display: inline-block;
  padding: 8px 16px 6px;
  line-height: 20px;
}
button.active {
  color: var(--color-branding-dark);
  border-bottom: 3px solid var(--color-branding-dark);
}
</style>
