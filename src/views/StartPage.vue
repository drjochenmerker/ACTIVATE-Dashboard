<script setup lang="ts">
// Import necessary dependencies and components
import { useColorMode } from '@vueuse/core';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { ref, onMounted, watch, computed } from 'vue';
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
import { useActivityStore } from '@/stores/activityStore';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import { PlusIcon } from 'lucide-vue-next';

useColorMode();
const sessionStore = useSessionStore();

// refs
const dialogOpen = ref(false);

// State management for activities
const selectedActivity = ref<string>();
const activityStore = useActivityStore();
const activities = computed(() => activityStore.activityList);

const newTitle = ref('');
const newDescription = ref('');
const defaultRole = ref('');
const titleError = ref(false);
const roleError = ref(false);


// Load all available activities on component mount
onMounted(async () => {
  try {
    await activityStore.getAllActivities();
  } catch (error) {
    console.error("Failed to load activities:", error);
  }
});
// Update available roles when selected activity changes
watch(selectedActivity, async () => {
  if (!selectedActivity.value) {
    return;
  }
  sessionStore.availableRoles = buildTreeStructByLang(
    await getActivityClassIds(selectedActivity.value, KnowledgeGraphActivityClass.subject),
    sessionStore.activeLanguage);
  sessionStore.sessionRole = ''; // Reset role selection
});



const addNewActivity = async () => {
  try {
    let hasError = false;
    if (!newTitle.value.trim()) {
      titleError.value = true;
      hasError = true;
    } else {
      titleError.value = false;
    }
    if (!defaultRole.value.trim()) {
      roleError.value = true;
      hasError = true;
    } else {
      roleError.value = false;
    }
    if (hasError) return;


    const res = await addActivity(newTitle.value, newDescription.value);
    await addEntity(res.modified, defaultRole.value, KnowledgeGraphActivityClass.subject);

    // Reload activities after adding a new one
    await activityStore.refreshActivityList();

    //close dialog
    dialogOpen.value = false;
    // reset form fields
    newTitle.value = '';
    newDescription.value = '';
    defaultRole.value = '';
  } catch (error) {
    console.error("Fehler beim Hinzufügen einer Aktivität:", error);
  }
}

</script>

<template>
  <!-- Main container with centered layout -->
  <div class="flex flex-col items-center justify-center py-10 px-4">
    <Card class="w-full max-w-5xl">

      <!-- Card header with logo -->
      <CardHeader class="flex justify-center items-center">
        <CardTitle class="flex justify-center w-full">
          <img src="@/assets/images/activate-logo-full.gif" alt="Logo" class="mx-auto" />
        </CardTitle>
      </CardHeader>

      <!-- "add button" in the middle -->
      <div class="flex justify-center my-6">
        <Dialog v-model:open="dialogOpen">
          <DialogTrigger as-child>
            <Button
              class="text-3xl px-6 py-3 rounded-full text-black bg-white border border-black hover:bg-black hover:text-white transition-colors duration-300">
              <PlusIcon class="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create new Activity</DialogTitle>

              <DialogDescription>Enter Title</DialogDescription>
              <textarea v-model="newTitle" :class="[
                'w-full border rounded p-2 mb-1 dark:bg-gray-900',
                titleError ? 'border-red-500' : 'border-gray-300'
              ]" />
              <p v-if="titleError" class="text-red-500 text-sm mb-2">Title is required.</p>
              <DialogDescription>Enter Description</DialogDescription>
              <textarea v-model="newDescription" class="w-full border rounded p-2 mb-2  dark:bg-gray-900" />

              <DialogDescription>Enter default role</DialogDescription>
              <textarea v-model="defaultRole" :class="[
                'w-full border rounded p-2 mb-1  dark:bg-gray-900',
                roleError ? 'border-red-500' : 'border-gray-300'
              ]" />
              <p v-if="roleError" class="text-red-500 text-sm mb-2">Default role is required.</p>

              <Button @click="addNewActivity">Done</Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <!-- Activities Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <ActivityCard v-for="activity in activities" :key="activity.name" :activity="activity" class="h-fit" />
      </div>
    </Card>
  </div>
</template>