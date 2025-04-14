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
  sessionStore.availableRoles = await getActivityClassIds(selectedActivity.value, KnowledgeGraphActivityClass.subject);
  sessionStore.sessionRole = ''; // Reset role selection
});

const addNewActivity = async () => {
  await addActivity(newTitle, newDescription);
  //await addEntity(newTitle, defaultRole, KnowledgeGraphActivityClass.subject);
  // Implement logic to add a new activity
  console.log('New activity added');
}


</script>

<template>
  <!-- Main container with centered card layout -->
  <div class="flex items-center justify-center h-screen">
    <Card>
      <!-- Card header with logo -->
      <CardHeader>
        <CardTitle>
          <img src=" @/assets/images/activate-logo-full.gif" class="" alt="Logo" />
        </CardTitle>
      </CardHeader>

      <div>

        <div class="delete-activity-button">
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="outline">
                <Delete />
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create new Activity</DialogTitle>
                <DialogDescription>Enter Title
                </DialogDescription>
                <textarea v-model="newTitle" />
                <DialogDescription>Enter Description</DialogDescription>
                <textarea v-model="newDescription" />
                <DialogDescription>Enter default role</DialogDescription>
                <textarea v-model="defaultRole" />

                <Button @click="() => addNewActivity()">Done</Button>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <div class="w-full max-w-md" v-for="activity in allActivities">
          <ActivityCard :activity="activity" />
        </div>
      </div>

    </Card>
  </div>
</template>
