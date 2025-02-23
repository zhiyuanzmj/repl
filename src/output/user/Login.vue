<script setup lang="ts">
import { ofetch } from 'ofetch'
import { Menu } from 'floating-vue'
import { inject } from 'vue'
import { type User, injectKeyProps } from '../../types'

const { store } = inject(injectKeyProps)!

function login() {
  location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.NITRO_CLIENT_ID}&redirect_uri=${location.origin}/api/oauth/redirect`
}

function logout() {
  ofetch('/api/logout')
  store.value.user = {} as User
}
</script>

<template>
  <Menu
    v-if="store.user.name"
    placement="bottom-end"
    :distance="6"
    class="flex items-center cursor-pointer"
  >
    <img
      :src="store.organization?.avatar_url || store.user.avatar"
      class="h6 w6 rounded-full"
    />
    <template #popper>
      <div class="flex-(~ col) min-w-40">
        <div class="b-(0 b-1 solid gray5) px5 py2 flex flex-col items-center">
          <img :src="store.user.avatar" class="h12 w12 rounded-full mb2" />

          <div class="max-h-78 mx--5 overflow-x-hidden overflow-y-auto">
            <div
              class="flex items-center px4 py2 w-full cursor-pointer op80 text-left hover:bg-$bg-soft"
              @click="store.organization = undefined"
            >
              <span
                :class="[store.userName === store.user.name || 'op0']"
                class="i-carbon:checkmark text-xl mr2"
              />
              <img :src="store.user.avatar" class="h5 w5 mr2" />
              <span class="flex-1">{{ store.user.name }}</span>
            </div>
            <div
              v-for="org in store.organizations"
              :key="org.id"
              class="flex items-center px4 py2 w-full cursor-pointer op80 text-center hover:bg-$bg-soft"
              @click="store.organization = org"
            >
              <span
                :class="[store.userName === org.login || 'op0']"
                class="i-carbon:checkmark text-xl mr2"
              />
              <img :src="org.avatar_url" class="h5 w5 mr2" />
              {{ org.login }}
            </div>
          </div>
        </div>

        <div
          class="px4 py2 cursor-pointer text-(sm center) hover:bg-$bg-soft"
          @click="logout"
        >
          Log out
        </div>
      </div>
    </template>
  </Menu>
  <button v-else class="text! bg!" @click="login">Log in</button>
</template>
