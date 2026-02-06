<script setup lang="ts">
import ActivityDiagram from "@/components/ActivityDiagram.vue";
// import { ref } from 'vue';
import { useSessionStore } from "@/stores/sessionStore";
import { staticContent } from "@/data/contentData";

// TMP not showing the editor
// import { storeToRefs } from 'pinia';
// import TripleAdditionDialog from '@/components/TripleAdditionDialog.vue';
// import EntityAdditionDialog from '@/components/EntityAdditionDialog.vue';
// import Editor from '@/components/Editor.vue';
// import { useActivityPointsStore } from "@/stores/activityPointsStore";
// import { Button } from '@/components/ui/button';

defineProps<{ conflicts: any[]; activity: any }>();

// const activityPointStore = useActivityPointsStore();
// const { getActivePoints } = storeToRefs(activityPointStore);
// const isTripleAdditionDialogOpen = ref(false);
// const isEntityAdditionDialogOpen = ref(false);

const sessionStore = useSessionStore();
// const isEditorDrawerOPen = ref(false); // todo check if editor is still needed
</script>

<!-- <template>
  <h1 class="text-2xl font-semibold mb-4 text-center">
    {{ staticContent.terms.setting[sessionStore.activeLanguage] }}:
    {{
      activity.name && activity.name[sessionStore.activeLanguage] || activity.name['default']
        ? activity.name[sessionStore.activeLanguage] || activity.name['default']
        : `${staticContent.errors.activityNameLoad[sessionStore.activeLanguage]} - Graph-ID: ${activity.graph}`
    }}
  </h1>
  <hr
    class="mt-4 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400" />
  <div class="flex w-full h-5/6 items-center mx-auto gap-4"
    :class="isEditorDrawerOPen ? 'justify-evenly' : 'justify-center'">


    <ActivityDiagram />

    <!-- Toggle Button with Dynamic Positioning -->
<!-- <Button @click="isEditorDrawerOPen = !isEditorDrawerOPen"
      :title="isEditorDrawerOPen ? 'Hide Editor' : 'Show Editor'" variant="default" size="icon" :class="[
        'z-50 rounded-full shadow transition-all',
        isEditorDrawerOPen ? 'self-end mb-2' : 'fixed top-1/2 right-4 transform -translate-y-1/2'
      ]">
      <span class="text-xl font-bold">
        {{ isEditorDrawerOPen ? '›' : '‹' }}
      </span>
    </Button> -->

<!-- <div class="flex flex-col">
      <transition name="fade">
        <div v-if="isEditorDrawerOPen" class="transition-all duration-300 ease-in-out">
          <Editor :activePoints="getActivePoints" />
          <div class="flex justify-center w-full mt-4 gap-4" v-if="useSessionStore().instructorMode">
            <TripleAdditionDialog v-model:isOpen="isTripleAdditionDialogOpen" />
            <EntityAdditionDialog v-model:isOpen="isEntityAdditionDialogOpen" />
          </div>
        </div>
      </transition>

    </div> 
  </div>
</template> -->
<template>
    <div class="flex flex-col h-full">
        <div>
            <h1 class="text-2xl font-semibold mb-1 text-center">
                {{ staticContent.terms.setting[sessionStore.activeLanguage] }}:
                {{
                    (activity.name && activity.name[sessionStore.activeLanguage]) || activity.name["default"]
                        ? activity.name[sessionStore.activeLanguage] || activity.name["default"]
                        : `${staticContent.errors.activityNameLoad[sessionStore.activeLanguage]} - Graph-ID: ${activity.graph}`
                }}
            </h1>
            <hr
                class="mt-4 h-0.5 border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-900 to-transparent opacity-70 dark:via-neutral-400"
            />
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
