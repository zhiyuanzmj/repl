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
    v-if="store.user.username"
    placement="bottom-end"
    :distance="6"
    class="flex items-center cursor-pointer"
  >
    <img :src="store.user.avatar" class="h6 w6 rounded-full" />
    <template #popper>
      <div class="flex-(~ col) min-w-30">
        <div
          class="b-(0 b-1 solid gray4) px5 py2 flex flex-col items-center gap2"
        >
          <img :src="store.user.avatar" class="h12 w12 rounded-full" />
          <span class="op80">{{ store.user.username }}</span>
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
