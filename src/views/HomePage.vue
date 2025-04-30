<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ActivityDiagram from '@/components/ActivityDiagram.vue';
import TripleAdditionDialog from '@/components/TripleAdditionDialog.vue';
import EntityAdditionDialog from '@/components/EntityAdditionDialog.vue';
import Editor from '@/components/Editor.vue';
import { useActivityPointsStore } from "@/stores/activityPointsStore";
import { ref } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';

defineProps<{ conflicts: any[], activity: any }>();

const activityPointStore = useActivityPointsStore();
const { getActivePoints } = storeToRefs(activityPointStore);

const isTripleAdditionDialogOpen = ref(false);
const isEntityAdditionDialogOpen = ref(false);

const sessionStore = useSessionStore();
</script>

<template>
  <h1 class="text-2xl font-semibold mb-4 text-center">{{ staticContent.terms.setting[sessionStore.activeLanguage] }}: {{
    activity.name ? activity.name : `${staticContent.errors.activityNameLoad[sessionStore.activeLanguage]} - Graph-ID:
    ${activity.graph}` }}</h1>
  <hr
    class="mt-4 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400" />
  <div class="flex w-full h-5/6 items-center justify-evenly mx-auto gap-4">

    <ActivityDiagram />
    <div
      class=" h-auto w-px self-stretch bg-gradient-to-tr from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400">
    </div>
    <div class="flex flex-col">
      <Editor :activePoints="getActivePoints" />
      <div class="flex justify-center w-full mt-4 gap-4" v-if="useSessionStore().instructorMode">
        <TripleAdditionDialog v-model:isOpen="isTripleAdditionDialogOpen" />
        <EntityAdditionDialog v-model:isOpen="isEntityAdditionDialogOpen" />
      </div>
    </div>
  </div>
</template>
