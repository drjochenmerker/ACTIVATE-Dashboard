<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { getActivities, getActivityDetail } from '@/data/knowledge_graph/read_operations';

const props = defineProps<{ conflicts: any[], activity: any }>();

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);

const hasActivePoints = computed(() => activityPointStore.getActivePoints.length > 0);

const activity = computed(() => getActivityDetail(props.activity));

// Daten laden beim Mount
onMounted(async () => {
  console.log(props.activity)

  // try {
  //   const activities = await getActivities();
  //   if (activities && activities.length > 0) {
  //     //activity = await getActivityDetail(activities[0]);
  //   }
  // } catch (error) {
  //   console.error("Fehler beim Laden der Aktivitäten:", error);
  // }
});

</script>

<template>
  <h1 class="text-2xl font-semibold mb-4">Home</h1>

  <div class="flex w-full h-2/3 relative mx-auto gap-4">
    <div class="flex-1 min-w-[900px]">
      <!-- ActivityDiagram nur rendern, wenn activity geladen ist -->
      <ActivityDiagram v-if="props.activity" :activity="props.activity"/>
    </div>

    <!-- Editor oder Platzhalter anzeigen -->
    <div class="flex-1">
      <Editor v-if="hasActivePoints" :activePoints="getActivePoints" />
    </div>
  </div>
</template>
