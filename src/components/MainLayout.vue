<script setup lang="ts">
import { getAllConflictsWithDetail } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { useConflictsStore } from '@/stores/conflictsStore';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import { useSessionStore } from '@/stores/sessionStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-vue-next';

const sessionStore = useSessionStore();
const route = useRoute();
const router = useRouter();
const activity = ref<Activity | undefined>(undefined);

const isOptionsRoute = computed(() => route.path === '/options');
const showMainContent = computed(() => !!activity.value || isOptionsRoute.value);

const conflictsStore = useConflictsStore();
const conflictDetails = ref<any[]>([]);

const loadConflicts = async () => {
  activity.value = sessionStore.sessionActivity;
  if (activity.value) {
    const conflicts = await getAllConflictsWithDetail(activity.value.graph);
    conflictsStore.setConflicts(conflicts);
    conflictDetails.value = conflicts;
  }
};

onMounted(async () => {
  try {
    await loadConflicts();

  } catch (error) {
    console.error("Fehler beim Laden der Konflikte:", error);
  }
});
</script>

<!-- <template>
  <div class="flex flex-col h-screen">
    <NavBar />
    <main class="flex-grow h-full p-6">
      <router-view v-if="activity" :key="$route.path" :activity="activity" :conflicts="conflictDetails" />
    </main>
  </div>
</template> -->
<template>
  <div class="flex flex-col h-screen">
    <!-- Regular navbar when a session is active, otherwise a basic navbar that allows back navigation --> 
    <NavBar v-if="sessionStore.isSessionActive" />
    <header
      v-if="!sessionStore.isSessionActive"
      class="flex h-14 shrink-0 items-center border-b bg-background px-6"
    >
      <Button variant="ghost" size="sm" class="gap-2" @click="router.push('/start')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </header>

    <main class="flex-grow min-h-0 p-6 overflow-y-auto">
      <router-view v-if="showMainContent" :key="$route.path" :activity="activity" :conflicts="conflictDetails" />
    </main>
  </div>
</template>