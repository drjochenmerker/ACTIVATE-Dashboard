<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import { useColorMode } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { getActivities, getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { useSession } from '@/stores/useSession';
import { ref, onMounted, watch } from 'vue';
import { useActivityStore } from '@/stores/activityStore';
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

useColorMode();
const { startSession } = useSession();
const router = useRouter();
const activityStore = useActivityStore();

const activities = ref<Activity[]>([]);
const selectedActivity = ref<string | undefined>(undefined);

onMounted(async () => {
  try {
    activities.value = await getActivities();

  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});

// const getDescription = () => {
//   return activities.value.find(a => a.graph === selectedActivity.value)?.name
// }

const handleStartSession = async () => {
  const activity = activities.value.find(a => a.graph === selectedActivity.value);
  if (activity) {
    activityStore.setActivity(activity);
  }
  activityStore.setRole(selectedRole.value);

  startSession();
  router.push('/');
}

const selectedRole = ref<string>('');
const roles = ref<string[]>([]);

watch(selectedActivity, async () => {
  if (selectedActivity.value) {
    roles.value = await getActivityClassIds(selectedActivity.value, KnowledgeGraphActivityClass.subject);
    selectedRole.value = '';
  }
});
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
            <SelectItem v-for="activity in activities" :value="activity.graph">
              {{ activity.graph }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="mt-4">
          <Label for="roleSelect">Role</Label>
          <Select v-model="selectedRole" :disabled="!selectedActivity" id="roleSelect">
            <SelectTrigger>
              <SelectValue placeholder="Select your role for the debriefing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :value="role">
                {{ role }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Not sure if this is right -->
        <!-- <div v-if="selectedActivity" class="mt-4">
          <Label>Description</Label>
          <p class="text-sm text-foreground">
            {{ getDescription() }}
          </p>
        </div> -->

      </CardContent>
      <CardFooter>
        <Button @click="handleStartSession" class="w-full" :disabled="!selectedActivity">
          <template v-if="!selectedActivity || !selectedRole">
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
