<script setup lang="ts">
import { Dropdown } from 'floating-vue'
import { computed, inject, ref, useTemplateRef } from 'vue'
import { ofetch } from 'ofetch'
import { injectKeyProps } from '../../types'

const { store } = inject(injectKeyProps)!

const loading = ref(false)

const name = ref()
const dropdownRef = useTemplateRef('dropdownRef')
async function submit() {
  loading.value = true
  await ofetch('/api/project', {
    method: 'POST',
    body: {
      name: name.value,
      userId: store.value.user.id,
      hash: store.value.serialize(),
    },
  })
  store.value.preset = store.value.user.username + '/' + name.value
  name.value = ''
  await store.value.getProjects()
  loading.value = false
  dropdownRef.value?.hide()
}

async function deleteProject(id: string) {
  if (confirm('Confirm delete the project?')) {
    loading.value = true
    await ofetch('/api/project/' + id, { method: 'DELETE' })
    await store.value.getProjects()
    loading.value = false
  }
}

const otherProject = computed(() => {
  return (
    store.value.project &&
    store.value.projects.every(
      (project) => project.id !== store.value.project?.id,
    ) &&
    store.value.project
  )
})
</script>

<template>
  <Dropdown ref="dropdownRef" :distance="8">
    <button class="i-carbon:add-large bg-$text! text-xl" />
    <template #popper>
      <form
        v-if="store.user.id"
        class="px4 py2 text-sm relative"
        @submit.prevent="submit"
      >
        <div class="text mb1 flex">
          <span class="op70">Project Name</span>
          <i
            class="ml-auto i-carbon:close-large cursor-pointer text-base mr-1"
            @click="dropdownRef?.hide()"
          />
        </div>
        <div class="flex items-center">
          <input
            v-model="name"
            class="outline-none bg-$bg-soft p2 rounded b-0"
          />
          <button
            type="submit"
            class="bg-$bg-soft b-0 ml3 cursor-pointer px2.5 py1.3 mr--2 rounded"
          >
            <div class="i-carbon:add-large bg-$text text-xl" />
          </button>
        </div>

        <div v-if="store.user.id" class="mt2">
          <div
            v-for="(project, index) in store.projects"
            :key="project.id"
            class="flex items-center p1 op80"
          >
            <span>{{ index + 1 }}. {{ project.name }} </span>
            <i
              class="ml-auto i-carbon:trash-can cursor-pointer text-base"
              @click="deleteProject(project.id)"
            />
          </div>
        </div>
        <div
          v-if="loading"
          class="h-full absolute bottom-0 top-0 left-0 right-0 bg op50 flex"
        >
          <div class="i-carbon:rotate-180 text h-6 w-6 m-auto animate-spin" />
        </div>
      </form>
      <div v-else class="px4 py2 text-sm">Please login first</div>
    </template>
  </Dropdown>

  <select
    v-model="store.preset"
    class="ml-auto b-(0 r-4 $border) bg-$border h-6 my-auto rounded outline-none px-1 text"
  >
    <optgroup label="Default">
      <option v-for="(_, presetName) in store.presets" :key="presetName">
        {{ presetName }}
      </option>
    </optgroup>
    <hr />
    <optgroup label="My Projects">
      <option
        v-if="otherProject"
        :value="otherProject.user.username + '/' + otherProject.name"
      >
        {{ otherProject.name }}
      </option>
      <option
        v-for="project in store.projects"
        :key="project.id"
        :value="project.user.username + '/' + project.name"
      >
        {{ project.name }}
      </option>
    </optgroup>
  </select>
</template>
