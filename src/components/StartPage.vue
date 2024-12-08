<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <h1>{{ msg }}</h1>

    <div>
      <button type="button" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" @click="count++">count is {{ count }}</button>
    </div>

  </div>
</template>

<style scoped>
</style>
