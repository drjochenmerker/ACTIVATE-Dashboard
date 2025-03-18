<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import { useColorMode } from '@vueuse/core';
import { useRouter } from 'vue-router';
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
import { getActivities, getActivityDetail, getAllConflictsWithDetail } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSession } from '@/stores/useSession';
import { ref, onMounted, nextTick } from 'vue';
import { useActivityStore } from '@/stores/activityStore';
import { Play } from 'lucide-vue-next';


useColorMode();
const { startSession } = useSession();
const router = useRouter();
const activityStore = useActivityStore();

const activities = ref<Activity[]>([]);
const selectedActivity = ref<string | null>(null);

onMounted(async () => {
  try {
    activities.value = await getActivities();

  } catch (error) {
    console.error("Fehler beim Laden der Aktivitäten:", error);
  }
});

const getDescription = () => {
  return activities.value.find(a => a.graph === selectedActivity.value)?.name
}

const handleStartSession = async () => {
  if (selectedActivity.value) {
    const activity = activities.value.find(a => a.graph === selectedActivity.value);
    if (activity) {
      activityStore.setActivity(activity);
    }
  }

  startSession();
  router.push('/');
}

</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <Card class="w-1/4">
      <CardHeader>
        <CardTitle>ACTIVATE</CardTitle>
      </CardHeader>
      <CardContent>
        <Select v-model="selectedActivity">
          <SelectTrigger>
            <SelectValue placeholder="Select a scenario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="activity in activities" :key="activity.graph" :value="activity.graph">
              {{ activity.graph }}
            </SelectItem>
          </SelectContent>
        </Select>

        <p class="text-sm text-muted-foreground mt-4">
          {{ getDescription() }}
        </p>

      </CardContent>
      <CardFooter>
        <Button @click="handleStartSession" class="w-full" :disabled="!selectedActivity">
          <Play /> Start Session
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
