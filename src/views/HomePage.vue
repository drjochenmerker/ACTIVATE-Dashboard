<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import TripleAdditionDialog from '@/components/TripleAdditionDialog.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";

defineProps<{ conflicts: any[], activity: any, activityGraph: string }>();

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);

const hasActivePoints = computed(() => activityPointStore.getActivePoints.length > 0);

const isTripleAdditionDialogOpen = ref(false);

</script>

<template>
  <div class="flex justify-between w-1/2 items-center mb-4">
    <h1 class="text-2xl font-semibold mb-4">Home ({{ activityGraph ? activityGraph : "Can't Load Activity Name" }})</h1>
    <TripleAdditionDialog v-model:isOpen="isTripleAdditionDialogOpen" />
    <!--<Button @click="() => isTripleAdditionDialogOpen = true">Add RDF-Triple</Button>-->
  </div>

  <div class="flex w-full h-2/3 relative mx-auto gap-4">
    <div class="flex-1 min-w-[900px]">
      <!-- ActivityDiagram nur rendern, wenn activity geladen ist -->
      <ActivityDiagram v-if="activity" :activity="activity" />
    </div>

    <!-- Editor oder Platzhalter anzeigen -->
    <div class="flex-1">
      <Editor :activePoints="getActivePoints" />
    </div>
  </div>
</template>
