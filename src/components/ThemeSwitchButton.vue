<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import { Sun, Moon } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()

const toggleMode = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <Button variant="secondary" size="icon" class="rounded-full" @click="toggleMode">
    <Sun class="h-5 w-5" v-if="mode === 'dark'" />
    <Moon class="h-5 w-5" v-else />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
