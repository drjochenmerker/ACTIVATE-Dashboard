<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import TripleAdditionDialog from '@/components/TripleAdditionDialog.vue';
import EntityAdditionDialog from '@/components/EntityAdditionDialog.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { ref } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';

defineProps<{ conflicts: any[], activity: any }>();

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);

const isTripleAdditionDialogOpen = ref(false);
const isEntityAdditionDialogOpen = ref(false);
</script>

<template>
  <div class="flex justify-between w-1/2 items-center mb-4">
    <h1 class="text-2xl font-semibold mb-4">Setting: {{ activity.name ? activity.graph : "Can't Load Activity Name" }}</h1>
  </div>

  <div class="flex w-full h-2/3 relative mx-auto gap-4">
    <div class="flex-1 min-w-[900px]">
      <ActivityDiagram/>
    </div>

    <div class="flex-1">
      <div class="inline-flex">
      <Editor :activePoints="getActivePoints" />
    </div>
          <div class="mt-4 flex gap-4" v-if="useSessionStore().instructorMode">
        <TripleAdditionDialog v-model:isOpen="isTripleAdditionDialogOpen" />
        <EntityAdditionDialog v-model:isOpen="isEntityAdditionDialogOpen" />
      </div>
    </div>
  </div>
</template>
