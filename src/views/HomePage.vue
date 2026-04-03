<script setup lang="ts">
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';
import { Activity, Conflict } from '@/data/knowledge_graph/structures';


defineProps<{ conflicts: Conflict[]; activity: Activity }>();

const sessionStore = useSessionStore();
</script>
<template>
  <div class="flex flex-col h-full">
    <div>

      <h1 class="text-2xl font-semibold mb-1 text-center">
        {{ staticContent.terms.setting[sessionStore.activeLanguage] }}:
        {{
          activity.name && (activity.name[sessionStore.activeLanguage] || activity.name['default'])
            ? activity.name[sessionStore.activeLanguage] || activity.name['default']
            : `${staticContent.errors.activityNameLoad[sessionStore.activeLanguage]} - Graph-ID: ${activity.graph}`
        }}
      </h1>
      <hr
        class="mt-4 h-0.5 border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400" />
    </div>
    <div class="flex mx-auto gap-4 justify-center w-full">
      <ActivityDiagram />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>