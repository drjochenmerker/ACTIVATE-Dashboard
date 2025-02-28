<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from './components/NavBar.vue';
// Backend Tests
import { getActivities, getActivityDetail, getAllConflictsWithDetail } from './data/knowledge_graph/read_operations';
import { useConflictsStore } from './stores/conflictsStore';
import { storeToRefs } from 'pinia';


const conflictsStore = useConflictsStore();
const { getConflicts } = storeToRefs(conflictsStore);

const conflictDetails = ref<any[]>([]);
const activityDetails = ref<any>(null);

const loadActivity = async () => {
  const activities = await getActivities();
  if (activities && activities.length > 0) {
    const activity = await getActivityDetail(activities[0]);
    return activity;
  }
};

const activity = loadActivity();

//provide("conflicts", conflictDetails);

onMounted(async () => {
  try {
    const activities = await getActivities();
    //activityDetails.value = activities[0];

    console.log(activity);

    if (activities && activities.length > 0) {
      getAllConflictsWithDetail(activities[0].graph).then((conflicts) => {
        conflictsStore.setConflicts(conflicts);
        conflictDetails.value = getConflicts.value;
      });
    }
  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});
</script>

<template>
    <div class="flex flex-col h-screen">
        <NavBar />
        <main class="flex-grow h-full p-6">
            <router-view :key="$route.path" :activity="activity" :conflicts="conflictDetails" />
        </main>
    </div>
</template>
