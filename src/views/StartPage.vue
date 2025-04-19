<script setup lang="ts">
// Import necessary dependencies and components
import { useColorMode } from '@vueuse/core';
import { getActivities, getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { ref, onMounted, watch } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
// UI components imports...
import {
  Card,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ActivityCard from '@/components/ActivityCard.vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addActivity, addEntity } from '@/data/knowledge_graph/write_operations';

useColorMode();
const sessionStore = useSessionStore();

// State management for activities
const selectedActivity = ref<string>();
const allActivities = ref<Activity[]>([]);

let newTitle = '';
let newDescription = '';
let defaultRole = '';

// Load all available activities on component mount
onMounted(async () => {
  try {
    allActivities.value = await getActivities();
  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});

// Update available roles when selected activity changes
watch(selectedActivity, async () => {
  if (!selectedActivity.value) {
    return;
  }
  // WARNING: Temporary solution. The label field might contain hierarchical a string like medical professional/doctor which would allow
  // multi-level dropdowns. This is not implemented yet. The results are also sorted by languages. If no language has been provided, "default" is
  // used as a fallback key. This is not used yet but implemented to allow language selection in the future. 
  const res = await getActivityClassIds(selectedActivity.value, KnowledgeGraphActivityClass.subject)
  sessionStore.availableRoles = res[Object.keys(res)[0]].map((role: {id:string, label: string}) => role.id);
  sessionStore.sessionRole = ''; // Reset role selection
});

const addNewActivity = async () => {
  const activity = await addActivity(newTitle, newDescription);
  // Implement logic to add a new activity
  console.log('New activity added: ', activity);
  await addEntity(newTitle, defaultRole, KnowledgeGraphActivityClass.subject);
  const rolle = await getActivityClassIds(newTitle, KnowledgeGraphActivityClass.subject);
  console.log("eingefügte rolle: ", rolle)
}


</script>

<template>
  <!-- Main container with centered layout -->
  <div class="flex flex-col items-center justify-center py-10 px-4">
    <Card class="w-full max-w-5xl">
      <!-- Card header with logo -->
      <CardHeader class="flex justify-center">
        <CardTitle>
          <img src="@/assets/images/activate-logo-full.gif" alt="Logo" />
        </CardTitle>
      </CardHeader>

      <!-- Add Button in der Mitte und größer -->
      <div class="flex justify-center my-6">
        <Dialog>
          <DialogTrigger as-child>
            <Button class="text-3xl px-6 py-3 rounded-full">
              +
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create new Activity</DialogTitle>

              <DialogDescription>Enter Title</DialogDescription>
              <textarea v-model="newTitle" class="w-full border rounded p-2 mb-2" />

              <DialogDescription>Enter Description</DialogDescription>
              <textarea v-model="newDescription" class="w-full border rounded p-2 mb-2" />

              <DialogDescription>Enter default role</DialogDescription>
              <textarea v-model="defaultRole" class="w-full border rounded p-2 mb-4" />

              <Button @click="() => addNewActivity()">Done</Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <!-- Activities Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <ActivityCard v-for="activity in allActivities" :key="activity.id" :activity="activity" />
      </div>
    </Card>
  </div>
</template>


<style scoped>
.delete-activity-button {
  flex-direction: column;
}
</style>