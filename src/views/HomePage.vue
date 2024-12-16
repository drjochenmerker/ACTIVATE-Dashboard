<script setup lang="ts">
import NewItemDialog from '@/components/dialogs/NewItemDialog.vue'
</script>

<template>
    <h1 class="text-2xl font-semibold mb-4">Home</h1>

    <div class="w-1/2 h-2/3 relative mx-auto">
        <div
            class="absolute inset-0 bg-muted animate-pulse"
            style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%)"
        ></div>
    </div>

    <NewItemDialog />
</template>
