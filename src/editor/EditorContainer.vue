<script setup lang="ts">
import FileSelector from './FileSelector.vue'
import Message from '../Message.vue'
import { debounce, useRouteQuery } from '../utils'
import { computed, inject } from 'vue'
import ToggleButton from './ToggleButton.vue'
import { type EditorComponentType, injectKeyProps } from '../types'
import { type File, configFileNames } from '../store'
import SplitPane from '../SplitPane.vue'
import { ofetch } from 'ofetch'

const props = defineProps<{
  editorComponent: EditorComponentType
}>()

const { store, virtualFiles, editorOptions } = inject(injectKeyProps)!
const showMessage = useRouteQuery('show-message', true)

function updateProject() {
  const paths = location.pathname.slice(0).split('/')
  const hasPermission = paths[0] === store.value.userName && paths[1]
  if (hasPermission) {
    history.pushState(null, '', location.pathname + location.search)
    if (store.value.project) {
      ofetch(
        '/api/project/' +
          store.value.project.userName +
          '/' +
          store.value.project.name,
        {
          method: 'PUT',
          body: {
            hash: store.value.serialize(),
          },
        },
      )
    }
  } else {
    history.replaceState({}, '', store.value.serialize())
  }
}

const onChange = debounce((code: string) => {
  store.value.activeFile.code = code
  updateProject()
}, 250)

const onConfigChange = debounce((code: string) => {
  store.value.activeConfigFile.code = code
  updateProject()
}, 250)

const resolvedFiles = computed(() => {
  const result = [{}, {}] as Record<string, File>[]
  for (const [name, file] of Object.entries(store.value.files)) {
    if (configFileNames.includes(name)) {
      result[1][name] = file
    } else {
      result[0][name] = file
    }
  }
  return result
})
</script>

<template>
  <SplitPane layout="vertical">
    <template #left>
      <div class="editor-container">
        <FileSelector
          :files="resolvedFiles[0]"
          :active-file="store.activeFile"
        />
        <props.editorComponent
          :value="store.activeFile.code"
          :filename="store.activeFile.filename"
          @change="onChange"
        />
      </div>
    </template>
    <template #right>
      <div class="editor-container">
        <FileSelector
          :files="resolvedFiles[1]"
          :active-file="store.activeConfigFile"
          disabled
        />
        <props.editorComponent
          :value="store.activeConfigFile.code"
          :filename="store.activeConfigFile.filename"
          @change="onConfigChange"
        />
      </div>
    </template>
  </SplitPane>

  <Message v-show="showMessage" :err="store.errors[0]" />

  <div class="editor-floating">
    <ToggleButton
      v-if="editorOptions?.virtualFilesText !== false"
      v-model="virtualFiles"
      :text="editorOptions?.virtualFilesText || 'Virtual Files'"
    />
    <ToggleButton
      v-if="editorOptions?.showErrorText !== false"
      v-model="showMessage"
      :text="editorOptions?.showErrorText || 'Show Error'"
    />
    <!-- <ToggleButton
      v-if="editorOptions?.autoSaveText !== false"
      v-model="autoSave"
      :text="editorOptions?.autoSaveText || 'Auto Save'"
    /> -->
  </div>
</template>

<style scoped>
.editor-container {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.editor-floating {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 11;
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 8px;
  background-color: var(--bg);
  color: var(--text-light);
  padding: 8px;
}
</style>
