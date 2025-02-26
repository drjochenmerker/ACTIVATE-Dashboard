<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { getActivities, getActivityDetail } from '@/data/knowledge_graph/read_operations';

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);
const hasActivePoints = computed(() => activityPointStore.getActivePoints.length > 0);
let activity: any = null;

// Daten laden beim Mount
onMounted(async () => {
  try {
    const activities = await getActivities();
    if (activities && activities.length > 0) {
      const activityDetail = await getActivityDetail(activities[0]);
      activity = activityDetail;
      //console.log("Aktivität geladen:", activity);
    }
  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});

defineProps<{ conflicts: any[] }>();
</script>

<template>
  <h1 class="text-2xl font-semibold mb-4">Home</h1>

  <div class="flex w-full h-2/3 relative mx-auto gap-4">
    <div class="flex-1 min-w-[900px]">
      <!-- ActivityDiagram nur rendern, wenn activity geladen ist -->
      <ActivityDiagram v-if="activity" :activity="activity" :activityConflicts="conflicts" />
    </div>

    <!-- Editor oder Platzhalter anzeigen -->
    <div class="flex-1">
      <Editor v-if="hasActivePoints" :activePoints="getActivePoints" />
    </div>
  </div>
</template>
