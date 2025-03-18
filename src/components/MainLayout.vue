<script setup lang="ts">
import { getActivities, getActivityDetail, getAllConflictsWithDetail } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { useConflictsStore } from '@/stores/conflictsStore';
import { ref, onMounted, watch } from 'vue';
import NavBar from './NavBar.vue';
import { useActivityStore } from '@/stores/activityStore';

const activityStore = useActivityStore();
const activity = ref<Activity | null>(null);

const conflictsStore = useConflictsStore();
const conflictDetails = ref<any[]>([]);

const loadActivity = async () => {
  const activities = await getActivities();
  activity.value = activities[0];
};

const loadConflicts = async () => {
  //this shit is somehow not working
  //activity.value = activityStore.getActivity();

  if (activity.value) {
    const conflicts = await getAllConflictsWithDetail("Urology_Emergency_after_Debriefing");
    conflictsStore.setConflicts(conflicts);
    conflictDetails.value = conflicts;
  }
};

onMounted(async () => {
  try {
    await loadActivity();
    await loadConflicts();

  } catch (error) {
    console.error("Fehler beim Laden der Konflikte:", error);
  }
});
</script>

<template>
    <div class="flex flex-col h-screen">
        <NavBar/>
        <main class="flex-grow h-full p-6">
            <router-view v-if="activity && conflictDetails.length > 0" :key="$route.path" :activity="activity" :activityGraph="activity.graph" :conflicts="conflictDetails" />
        </main>
    </div>
</template>

