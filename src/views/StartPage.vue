<script setup lang="ts">
// Import necessary dependencies and components
import { useColorMode } from '@vueuse/core';
import { getActivities, getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { Activity, KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
import { ref, onMounted, watch } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { Play, Loader2 } from 'lucide-vue-next';
// UI components imports...
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import Label from '@/components/ui/label/Label.vue';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import Button from '@/components/ui/button/Button.vue';
import { buildTreeStructByLang } from '@/data/knowledge_graph/utils';
import RecursiveSelect from '@/components/RecursiveSelect.vue';

useColorMode();
const sessionStore = useSessionStore();

// State management for activities
const selectedActivity = ref<string>();
const allActivities = ref<Activity[]>([]);

// Load all available activities on component mount
onMounted(async () => {
  try {
    allActivities.value = await getActivities();
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

// Handle session start when user clicks start button
const handleStartSession = async () => {
  sessionStore.sessionActivity = allActivities.value.find(a => a.graph === selectedActivity.value)!;
  sessionStore.startSession();
}

// Validate if session can be started (requires both activity and role selection)
const sessionStartAllowed = () => !selectedActivity || !sessionStore.sessionRole;
</script>

<template>
  <!-- Main container with centered card layout -->
  <div class="flex items-center justify-center h-screen">
    <Card class="w-1/4">
      <!-- Card header with logo -->
      <CardHeader>
        <CardTitle>
          <img src="@/assets/images/activate-logo-full.gif" class="" alt="Logo" />
        </CardTitle>
      </CardHeader>

      <!-- Main form content -->
      <CardContent>
        <!-- Activity selection dropdown -->
        <Label for="activitySelect">Activity</Label>
        <Select v-model="selectedActivity" id="activitySelect">
          <!-- Select components... -->
          <SelectTrigger>
            <SelectValue placeholder="Select an activity for the debriefing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="activity in allActivities" :value="activity.graph">
              {{ activity.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Role selection dropdown (disabled until activity is selected) -->
        <div class="mt-4">
          <Label for="roleSelect">Role</Label>
          <Select v-model="sessionStore.sessionRole" :disabled="!selectedActivity" id="roleSelect">
            <!-- Select components... -->
            <SelectTrigger>
              <SelectValue placeholder="Select your role for the debriefing" />
            </SelectTrigger>
            <SelectContent>
              <RecursiveSelect :node="sessionStore.availableRoles" />
            </SelectContent>
          </Select>
        </div>

        <!-- Instructor mode toggle -->
        <div class="flex items-center space-x-2 mt-4">
          <Checkbox id="cbInstructorMode" :checked="sessionStore.instructorMode"
            @update:checked="sessionStore.instructorMode = $event" />
          <Label for="cbInstructorMode" class="text-sm font-normal">
            Enable Instructor Mode
          </Label>
        </div>
      </CardContent>

      <!-- Start button with dynamic state -->
      <CardFooter>
        <Button @click="handleStartSession" class="w-full" :disabled="sessionStartAllowed()">
          <!-- Button content changes based on selection state -->
          <template v-if="sessionStartAllowed()">
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Select activity and role
          </template>
          <template v-else>
            <Play />
            Start debriefing
          </template>
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
