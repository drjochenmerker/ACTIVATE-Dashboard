<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from './components/NavBar.vue';
// Backend Tests
import { getActivities, getActivityDetail, getAllConflictsWithDetail, getPredicateObject } from './data/knowledge_graph/read_operations';
import { useConflictsStore } from './stores/conflictsStore';


const conflictsStore = useConflictsStore();

const conflictDetails = ref<any[]>([]);
const activity = ref<any>(null);
const activityGraph = ref<any>(null);

const loadActivity = async () => {
  const activities = await getActivities();
  if (activities && activities.length > 0) {
    activity.value = await getActivityDetail(activities[0]);
    activityGraph.value = activities[0].graph;
  }
};

const loadConflicts = async () => {
  if (activity.value && activityGraph.value) {
    const conflicts = await getAllConflictsWithDetail(activityGraph.value);
    conflictsStore.setConflicts(conflicts);
    conflictDetails.value = conflictsStore.getConflicts;
  }
};

onMounted(async () => {
  try {
    await loadActivity();
    await loadConflicts();
    const preds = await getPredicateObject(activityGraph.value);
    console.log("Predicates:", preds);
    console.log("test", preds.getBidirectional(["subject", "rules"]), preds.ge);
  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});
</script>

<template>
    <div class="flex flex-col h-screen">
        <NavBar />
        <main class="flex-grow h-full p-6">
            <router-view v-if="activity && conflictDetails.length > 0" :key="$route.path" :activity="activity" :activityGraph="activityGraph" :conflicts="conflictDetails" />
        </main>
    </div>
</template>
