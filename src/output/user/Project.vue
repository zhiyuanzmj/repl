<script setup lang="ts">
import { Menu } from 'floating-vue'
import { computed, inject, ref, watch } from 'vue'
import { ofetch } from 'ofetch'
import { type Project, injectKeyProps } from '../../types'

const test = 3

const { store } = inject(injectKeyProps)!

const loading = ref(false)

const name = ref()
async function submit() {
  loading.value = true
  try {
    await ofetch('/api/project', {
      method: 'POST',
      body: {
        name: name.value,
        userName: store.value.userName,
        userId: store.value.user.id,
        hash: store.value.serialize(),
      },
    })
    store.value.preset = store.value.userName + '/' + name.value
    name.value = ''
    getProjects()
  } finally {
    loading.value = false
  }
}

const projects = ref<Project[]>([])
async function getProjects() {
  if (!store.value.userName) return
  const { data } = await ofetch('/api/project', {
    params: {
      userName: store.value.userName,
    },
  }).catch(() => ({ data: [] }))
  projects.value = data.map((i: Project) => ({
    ...i,
    originName: i.name,
  }))
}
getProjects()

const publicProjects = ref<Project[]>([])
async function getPublicProjects() {
  const { data } = await ofetch('/api/project').catch(() => ({ data: [] }))
  publicProjects.value = data
}
getPublicProjects()

watch(
  () => store.value.userName,
  async () => {
    await getProjects()
    const project = projects.value[0]
    store.value.project = project
    store.value.preset = project
      ? `${project.userName}/${project.name}`
      : 'vue-jsx'
  },
)

const groupFn = (acc: Record<string, Project[]>, project: Project) => {
  if (!acc[project.userName]) {
    acc[project.userName] = []
  }
  if (!acc[project.userName].some((i) => i.id === project.id)) {
    acc[project.userName].push(project)
  }
  return acc
}
const projectsGroup = computed(() =>
  publicProjects.value.reduce(groupFn, projects.value.reduce(groupFn, {})),
)

async function deleteProject(project: Project) {
  if (confirm('Confirm delete the project?')) {
    loading.value = true
    try {
      await ofetch(
        '/api/project/' + project.userName + '/' + project.originName,
        { method: 'DELETE' },
      )
      getProjects()
    } finally {
      loading.value = false
    }
  }
}

async function updateProject(project: Project) {
  loading.value = true
  try {
    await ofetch(
      '/api/project/' + project.userName + '/' + project.originName,
      {
        method: 'PUT',
        body: {
          name: project.name,
          userName: project.userName,
        },
      },
    )
    if (store.value.project?.id === project.id) {
      store.value.preset = store.value.userName + '/' + project.name
    }
    await getProjects()
    project.editing = false
  } finally {
    loading.value = false
  }
}

async function toggleProjectPublic(project: Project) {
  loading.value = true
  try {
    await ofetch('/api/project/' + project.userName + '/' + project.name, {
      method: 'PUT',
      body: {
        public: !project.public,
      },
    })
    getProjects()
  } finally {
    loading.value = false
  }
}

const otherProject = computed(() => {
  return (
    store.value.project &&
    projects.value.every((project) => project.id !== store.value.project?.id) &&
    publicProjects.value.every(
      (project) => project.id !== store.value.project?.id,
    ) &&
    store.value.project
  )
})
</script>

<template>
  <Menu :distance="8">
    <button class="i-carbon:add-large bg-$text! text-xl" />
    <template #popper>
      <form
        v-if="store.user.id"
        class="px4 py2 text-sm relative"
        @submit.prevent
      >
        <div class="text mb1 flex op70">Project Name</div>
        <div class="flex items-center">
          <input
            v-model="name"
            class="outline-none bg-$bg-soft p2 rounded b-0 w-full"
            @keydown.enter="submit"
          />
          <button
            class="bg-$bg-soft b-0 ml3 cursor-pointer px2.5 py1.3 mr--2 rounded"
            type="button"
            @click="submit"
          >
            <div class="i-carbon:add-large bg-$text text-xl" />
          </button>
        </div>

        <div v-if="store.user.id" class="mt2">
          <div
            v-for="(project, index) in projects"
            :key="project.id"
            class="flex items-center p1 op80"
          >
            <span class="flex items-center h6 w-46">
              <span class="text-center w-4 mr1">{{ index + 1 }}.</span>
              <input
                v-if="project.editing"
                v-model="project.name"
                class="outline-none bg-$bg-soft p2 rounded b-0"
                @keydown.enter="updateProject(project)"
              />
              <span v-else>{{ project.name }}</span>
            </span>

            <template v-if="project.editing">
              <i
                class="ml-auto i-carbon:save cursor-pointer text-lg"
                @click="updateProject(project)"
              />
              <i
                class="i-carbon:close-outline cursor-pointer text-lg ml-1 mr--2"
                @click="project.editing = false"
              />
            </template>
            <template v-else>
              <i
                v-if="store.user.role === 'ADMIN'"
                class="ml-auto cursor-pointer text-lg mr-1.5"
                :class="project.public ? 'i-carbon:view' : 'i-carbon:view-off'"
                @click="toggleProjectPublic(project)"
              />
              <i
                class="ml-auto i-carbon:edit cursor-pointer text-lg"
                @click="project.editing = true"
              />
              <i
                class="i-carbon:trash-can cursor-pointer text-lg ml-1 mr--2"
                @click="deleteProject(project)"
              />
            </template>
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
  </Menu>

  <select
    v-model="store.preset"
    class="ml-auto b-(0 r-4 $border) bg-$border h-6 my-auto rounded outline-none px-1 text"
  >
    <optgroup label="Default">
      <option v-for="(_, presetName) in store.presets" :key="presetName">
        {{ presetName }}
      </option>
      <option
        v-if="otherProject"
        :value="otherProject.userName + '/' + otherProject.name"
      >
        {{ otherProject.name }}
      </option>
    </optgroup>
    <hr />
    <optgroup
      v-for="(list, label) in projectsGroup"
      :key="label"
      :label="label"
    >
      <option
        v-for="project in list"
        :key="project.id"
        :value="project.userName + '/' + project.name"
      >
        {{ project.name }}
      </option>
    </optgroup>
  </select>
</template>
