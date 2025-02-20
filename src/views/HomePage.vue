<script setup lang="ts">
import NewItemDialog from '@/components/dialogs/NewItemDialog.vue';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { computed } from 'vue';


const activityPointStore = useActivityPointsStore();

const hasActivePoints = computed(() => activityPointStore.getActivePoints.length > 0);

</script>

<template>
    <h1 class="text-2xl font-semibold mb-4">Home</h1>

    <div class="flex w-full h-2/3 relative mx-auto gap-4">
        <div class="flex-1 min-w-[900px]">
            <ActivityDiagram />
        </div>

        <!-- Editor oder Platzhalter anzeigen -->
        <div class="flex-1">
            <Editor v-if="hasActivePoints" />
        </div>
    </div>

    <NewItemDialog />
</template>
