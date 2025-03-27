<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { getActivities, getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { ref, onMounted, watch } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { Play, Loader2 } from 'lucide-vue-next';
import { KnowledgeGraphActivityClass } from '@/data/knowledge_graph/structures';
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
  SelectValue,
} from '@/components/ui/select';
import Label from '@/components/ui/label/Label.vue';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import Button from '@/components/ui/button/Button.vue';

useColorMode();
const sessionStore = useSessionStore();

const selectedActivity = ref<string>();
const allActivities = ref<Activity[]>([]);

onMounted(async () => {
  try {
    allActivities.value = await getActivities();

  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});

watch(selectedActivity, async () => {
  if (!selectedActivity.value) {
    return;
  }
  sessionStore.availableRoles = await getActivityClassIds(selectedActivity.value, KnowledgeGraphActivityClass.subject);
  sessionStore.sessionRole = ''; // Unset role when activity changes
});

const handleStartSession = async () => {
  sessionStore.sessionActivity = allActivities.value.find(a => a.graph === selectedActivity.value)!;
  sessionStore.startSession();
}

const sessionStartAllowed = () => !selectedActivity || !sessionStore.sessionRole;
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <Card class="w-1/4">
      <CardHeader>
        <CardTitle>
          <img src="@/assets/images/activate-logo-full.gif" class="" alt="Logo" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label for="activitySelect">Activity</Label>
        <Select v-model="selectedActivity" id="activitySelect">
          <SelectTrigger>
            <SelectValue placeholder="Select an activity for the debriefing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="activity in allActivities" :value="activity.graph">
              {{ activity.graph }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="mt-4">
          <Label for="roleSelect">Role</Label>
          <Select v-model="sessionStore.sessionRole" :disabled="!selectedActivity" id="roleSelect">
            <SelectTrigger>
              <SelectValue placeholder="Select your role for the debriefing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in sessionStore.availableRoles" :value="role">
                {{ role }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center space-x-2 mt-4">
          <Checkbox id="cbInstructorMode" :checked="sessionStore.instructorMode"
            @update:checked="sessionStore.instructorMode = $event" />
          <Label for="cbInstructorMode" class="text-sm font-normal">
            Enable Instructor Mode
          </Label>
        </div>

      </CardContent>
      <CardFooter>
        <Button @click="handleStartSession" class="w-full" :disabled="sessionStartAllowed()">
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
