<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
defineProps<{
    visible: boolean
    message?: string
}>()
</script>

<template>
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-[2000]">
        <Loader2 class="animate-spin h-10 w-10 text-white" />
        <span class="mt-3 text-white text-lg">{{ message }}</span>
    </div>
</template>
