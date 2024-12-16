<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()

const toggleMode = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
    <Button size="icon" class="rounded-full" @click="toggleMode">
        <Sun v-if="mode === 'dark'" />
        <Moon v-else />
    </Button>
</template>
