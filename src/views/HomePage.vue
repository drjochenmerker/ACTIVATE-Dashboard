<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";

defineProps<{ conflicts: any[], activity: any }>();

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);

const hasActivePoints = computed(() => activityPointStore.getActivePoints.length > 0);

</script>

<template>
  <h1 class="text-2xl font-semibold mb-4">Home</h1>

  <div class="flex w-full h-2/3 relative mx-auto gap-4">
    <div class="flex-1 min-w-[900px]">
      <!-- ActivityDiagram nur rendern, wenn activity geladen ist -->
      <ActivityDiagram v-if="activity" :activity="activity"/>
    </div>

    <!-- Editor oder Platzhalter anzeigen -->
    <div class="flex-1">
      <Editor v-if="hasActivePoints" :activePoints="getActivePoints" />
    </div>
  </div>
</template>
