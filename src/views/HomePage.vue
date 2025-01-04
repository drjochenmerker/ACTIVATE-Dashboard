<script setup lang="ts">
import NewItemDialog from '@/components/dialogs/NewItemDialog.vue';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
</script>

<template>
    <h1 class="text-2xl font-semibold mb-4">Home</h1>

    <div class="w-1/2 h-2/3 relative mx-auto">
        <ActivityDiagram/>
    </div>

    <NewItemDialog />
</template>
